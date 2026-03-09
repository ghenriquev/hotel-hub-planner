import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelId, websiteUrl, action, apifyRunId } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Action: check-status - poll Apify run and save results when done
    if (action === 'check-status') {
      return await handleCheckStatus(supabase, hotelId, apifyRunId);
    }

    // Default action: start crawl
    return await handleStartCrawl(supabase, hotelId, websiteUrl);

  } catch (error) {
    console.error("[crawl-hotel-website] Error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleStartCrawl(supabase: any, hotelId: string, websiteUrl: string) {
  console.log(`[crawl-hotel-website] Starting async crawl for hotel ${hotelId}, URL: ${websiteUrl}`);

  if (!hotelId || !websiteUrl) {
    throw new Error("hotelId and websiteUrl are required");
  }

  // Fetch Apify API Key
  const { data: apifyKeyData, error: keyError } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('is_active', true)
    .or('name.ilike.%apify%,name.ilike.%apfy%,key_type.ilike.%apify%')
    .maybeSingle();

  if (keyError || !apifyKeyData?.api_key) {
    await supabase.from('hotel_website_data').upsert({
      hotel_id: hotelId,
      website_url: websiteUrl,
      status: 'error',
      error_message: 'Nenhuma API key do Apify encontrada. Adicione uma nas Configurações.',
    }, { onConflict: 'hotel_id' });
    throw new Error("No active Apify API key found");
  }

  // Fetch research settings
  const { data: researchSettings } = await supabase
    .from('research_settings')
    .select('website_max_pages, website_max_depth, website_crawler_type')
    .limit(1)
    .maybeSingle();

  const maxPages = researchSettings?.website_max_pages || 10;
  const maxDepth = researchSettings?.website_max_depth || 2;
  const crawlerType = researchSettings?.website_crawler_type || 'playwright:firefox';

  // Normalize URL
  let normalizedUrl = websiteUrl;
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  // Update status to 'crawling'
  await supabase.from('hotel_website_data').upsert({
    hotel_id: hotelId,
    website_url: websiteUrl,
    status: 'crawling',
    error_message: null,
  }, { onConflict: 'hotel_id' });

  // Start ASYNC Apify run (not sync)
  console.log(`[crawl-hotel-website] Starting async Apify run: maxPages=${maxPages}, maxDepth=${maxDepth}, crawlerType=${crawlerType}`);
  
  const apifyResponse = await fetch(
    `https://api.apify.com/v2/acts/apify~website-content-crawler/runs?token=${apifyKeyData.api_key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startUrls: [{ url: normalizedUrl }],
        maxCrawlPages: maxPages,
        maxCrawlDepth: maxDepth,
        crawlerType: crawlerType,
        proxyConfiguration: {
          useApifyProxy: true,
        },
      }),
    }
  );

  if (!apifyResponse.ok) {
    const errorText = await apifyResponse.text();
    console.error("[crawl-hotel-website] Apify API error:", apifyResponse.status, errorText);
    
    await supabase.from('hotel_website_data').update({
      status: 'error',
      error_message: `Erro na API do Apify: ${apifyResponse.status}`,
    }).eq('hotel_id', hotelId);
    
    throw new Error(`Apify API error: ${apifyResponse.status}`);
  }

  const runData = await apifyResponse.json();
  const runId = runData?.data?.id;

  console.log(`[crawl-hotel-website] Apify run started with ID: ${runId}`);

  // Store the run ID in the error_message field temporarily (we'll use it for polling)
  // We use a dedicated approach: store run ID so the frontend can poll
  await supabase.from('hotel_website_data').update({
    status: 'crawling',
    error_message: runId ? `apify_run:${runId}` : null,
  }).eq('hotel_id', hotelId);

  return new Response(JSON.stringify({ 
    success: true, 
    status: 'crawling',
    runId: runId,
    message: 'Crawl iniciado. Os resultados serão salvos automaticamente.'
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleCheckStatus(supabase: any, hotelId: string, apifyRunId: string) {
  console.log(`[crawl-hotel-website] Checking status for hotel ${hotelId}, run ${apifyRunId}`);

  if (!hotelId || !apifyRunId) {
    throw new Error("hotelId and apifyRunId are required");
  }

  // Fetch Apify API Key
  const { data: apifyKeyData } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('is_active', true)
    .or('name.ilike.%apify%,name.ilike.%apfy%,key_type.ilike.%apify%')
    .maybeSingle();

  if (!apifyKeyData?.api_key) {
    throw new Error("No Apify API key found");
  }

  // Check run status
  const statusResponse = await fetch(
    `https://api.apify.com/v2/actor-runs/${apifyRunId}?token=${apifyKeyData.api_key}`
  );

  if (!statusResponse.ok) {
    const errorText = await statusResponse.text();
    console.error("[crawl-hotel-website] Error checking run status:", errorText);
    throw new Error("Failed to check run status");
  }

  const statusData = await statusResponse.json();
  const runStatus = statusData?.data?.status;

  console.log(`[crawl-hotel-website] Apify run status: ${runStatus}`);

  if (runStatus === 'SUCCEEDED') {
    // Fetch dataset items
    const datasetId = statusData?.data?.defaultDatasetId;
    const itemsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyKeyData.api_key}`
    );

    if (!itemsResponse.ok) {
      throw new Error("Failed to fetch dataset items");
    }

    const crawledData = await itemsResponse.json();
    console.log(`[crawl-hotel-website] Got ${Array.isArray(crawledData) ? crawledData.length : 0} pages`);

    const processedContent = Array.isArray(crawledData) ? crawledData.map((page: any) => ({
      url: page.url,
      title: page.metadata?.title || page.title || '',
      description: page.metadata?.description || '',
      text: page.text?.substring(0, 5000) || '',
    })) : [];

    await supabase.from('hotel_website_data').update({
      crawled_content: processedContent,
      crawled_at: new Date().toISOString(),
      status: 'completed',
      error_message: null,
    }).eq('hotel_id', hotelId);

    return new Response(JSON.stringify({ 
      success: true, 
      status: 'completed',
      pagesCount: processedContent.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } else if (runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
    await supabase.from('hotel_website_data').update({
      status: 'error',
      error_message: `Apify run ${runStatus.toLowerCase()}`,
    }).eq('hotel_id', hotelId);

    return new Response(JSON.stringify({ 
      success: false, 
      status: 'error',
      error: `Apify run ${runStatus.toLowerCase()}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } else {
    // Still running (RUNNING, READY, etc.)
    return new Response(JSON.stringify({ 
      success: true, 
      status: 'crawling',
      runStatus: runStatus,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
