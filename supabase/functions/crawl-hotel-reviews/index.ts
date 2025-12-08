import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewsRequest {
  hotelId: string;
  source: 'google' | 'tripadvisor' | 'booking' | 'all';
}

// Actor configurations for each platform - using verified Apify actor IDs
const ACTOR_CONFIGS = {
  google: {
    actorId: 'compass/google-maps-reviews-scraper',
    buildInput: (url: string) => ({
      startUrls: [{ url }],
      maxReviews: 500,
      language: 'pt-BR',
    }),
    extractReviews: (data: any) => data,
  },
  tripadvisor: {
    actorId: 'Hvp4YfFGyLM635Q2F',
    buildInput: (url: string) => ({
      startUrls: [{ url }],
      maxItems: 500,
    }),
    extractReviews: (data: any) => data,
  },
  booking: {
    actorId: 'plowdata/booking-com-review-scraper',
    buildInput: (url: string) => ({
      urls: [{ url }],
    }),
    extractReviews: (data: any) => data,
  },
};

async function getApifyApiKey(supabase: any): Promise<string | null> {
  // Primeiro tenta buscar por key_type = 'apify'
  let { data, error } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('key_type', 'apify')
    .eq('is_active', true)
    .maybeSingle();

  // Se não encontrar, busca pelo nome contendo 'apify'
  if (!data) {
    console.log('No key found with key_type=apify, searching by name...');
    const result = await supabase
      .from('api_keys')
      .select('api_key')
      .ilike('name', '%apify%')
      .eq('is_active', true)
      .maybeSingle();
    
    data = result.data;
    error = result.error;
  }

  if (error || !data) {
    console.error('Error fetching Apify API key:', error);
    return null;
  }

  console.log('Apify API key found successfully');
  return data.api_key;
}

async function getHotelUrls(supabase: any, hotelId: string) {
  const { data, error } = await supabase
    .from('hotels')
    .select('google_business_url, tripadvisor_url, booking_url, name, city')
    .eq('id', hotelId)
    .single();

  if (error) {
    console.error('Error fetching hotel:', error);
    return null;
  }

  return data;
}

async function runApifyActor(apiKey: string, actorId: string, input: any): Promise<any[]> {
  // Converter o separador de / para ~ conforme exigido pela API do Apify
  const formattedActorId = actorId.replace('/', '~');
  
  console.log(`Starting Apify actor: ${formattedActorId}`);
  console.log('Input:', JSON.stringify(input));

  // Start the actor run
  const runResponse = await fetch(
    `https://api.apify.com/v2/acts/${formattedActorId}/runs?token=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );

  if (!runResponse.ok) {
    const errorText = await runResponse.text();
    console.error(`Failed to start actor ${actorId}:`, errorText);
    throw new Error(`Failed to start Apify actor: ${errorText}`);
  }

  const runData = await runResponse.json();
  const runId = runData.data.id;
  console.log(`Actor run started with ID: ${runId}`);

  // Wait for the run to complete (poll every 5 seconds, max 5 minutes)
  const maxWaitTime = 5 * 60 * 1000; // 5 minutes
  const pollInterval = 5000; // 5 seconds
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`
    );

    if (!statusResponse.ok) {
      throw new Error('Failed to check actor run status');
    }

    const statusData = await statusResponse.json();
    const status = statusData.data.status;

    console.log(`Actor run status: ${status}`);

    if (status === 'SUCCEEDED') {
      // Get the results from the dataset
      const datasetId = statusData.data.defaultDatasetId;
      const resultsResponse = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}`
      );

      if (!resultsResponse.ok) {
        throw new Error('Failed to fetch actor results');
      }

      const results = await resultsResponse.json();
      console.log(`Got ${results.length} results from actor`);
      return results;
    }

    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Actor run ${status}`);
    }

    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Actor run timed out');
}

async function crawlSource(
  supabase: any,
  apiKey: string,
  hotelId: string,
  source: 'google' | 'tripadvisor' | 'booking',
  sourceUrl: string | null
): Promise<{ success: boolean; reviewsCount: number; error?: string }> {
  console.log(`Crawling ${source} for hotel ${hotelId}`);

  if (!sourceUrl) {
    return { success: false, reviewsCount: 0, error: `URL do ${source} não cadastrada` };
  }

  // Update status to crawling
  await supabase
    .from('hotel_reviews_data')
    .upsert({
      hotel_id: hotelId,
      source,
      source_url: sourceUrl,
      status: 'crawling',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'hotel_id,source' });

  try {
    const config = ACTOR_CONFIGS[source];
    const input = config.buildInput(sourceUrl);
    const results = await runApifyActor(apiKey, config.actorId, input);
    const reviews = config.extractReviews(results);

    // Save the results
    await supabase
      .from('hotel_reviews_data')
      .upsert({
        hotel_id: hotelId,
        source,
        source_url: sourceUrl,
        status: 'completed',
        reviews_count: reviews.length,
        reviews_data: reviews,
        crawled_at: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'hotel_id,source' });

    console.log(`Successfully crawled ${reviews.length} reviews from ${source}`);
    return { success: true, reviewsCount: reviews.length };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error crawling ${source}:`, errorMessage);

    // Update status to error
    await supabase
      .from('hotel_reviews_data')
      .upsert({
        hotel_id: hotelId,
        source,
        source_url: sourceUrl,
        status: 'error',
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'hotel_id,source' });

    return { success: false, reviewsCount: 0, error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { hotelId, source }: ReviewsRequest = await req.json();

    if (!hotelId) {
      return new Response(
        JSON.stringify({ error: 'hotelId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing reviews request for hotel ${hotelId}, source: ${source}`);

    // Get Apify API key
    const apiKey = await getApifyApiKey(supabase);
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Apify API key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get hotel URLs
    const hotel = await getHotelUrls(supabase, hotelId);
    if (!hotel) {
      return new Response(
        JSON.stringify({ error: 'Hotel not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const urlMap = {
      google: hotel.google_business_url,
      tripadvisor: hotel.tripadvisor_url,
      booking: hotel.booking_url,
    };

    const results: Record<string, { success: boolean; reviewsCount: number; error?: string }> = {};

    if (source === 'all') {
      // Crawl all sources in parallel
      const [googleResult, tripadvisorResult, bookingResult] = await Promise.all([
        crawlSource(supabase, apiKey, hotelId, 'google', urlMap.google),
        crawlSource(supabase, apiKey, hotelId, 'tripadvisor', urlMap.tripadvisor),
        crawlSource(supabase, apiKey, hotelId, 'booking', urlMap.booking),
      ]);

      results.google = googleResult;
      results.tripadvisor = tripadvisorResult;
      results.booking = bookingResult;
    } else {
      results[source] = await crawlSource(supabase, apiKey, hotelId, source, urlMap[source]);
    }

    console.log('Crawl results:', results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in crawl-hotel-reviews:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
