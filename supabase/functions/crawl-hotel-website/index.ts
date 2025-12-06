import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelId, websiteUrl } = await req.json();
    
    console.log(`[crawl-hotel-website] Starting crawl for hotel ${hotelId}, URL: ${websiteUrl}`);

    if (!hotelId || !websiteUrl) {
      throw new Error("hotelId and websiteUrl are required");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update status to 'crawling'
    await supabase.from('hotel_website_data').upsert({
      hotel_id: hotelId,
      website_url: websiteUrl,
      status: 'crawling',
      error_message: null,
    }, { onConflict: 'hotel_id' });

    // Fetch Apify API Key from api_keys table
    const { data: apifyKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .or('name.ilike.%apify%,key_type.ilike.%apify%')
      .eq('is_active', true)
      .maybeSingle();

    if (keyError) {
      console.error("[crawl-hotel-website] Error fetching API key:", keyError);
      throw new Error("Error fetching Apify API key");
    }

    if (!apifyKeyData?.api_key) {
      console.error("[crawl-hotel-website] No active Apify API key found");
      await supabase.from('hotel_website_data').update({
        status: 'error',
        error_message: 'Nenhuma API key do Apify encontrada. Adicione uma nas Configurações.',
      }).eq('hotel_id', hotelId);
      
      throw new Error("No active Apify API key found. Please add one in Settings.");
    }

    console.log("[crawl-hotel-website] Found Apify API key, starting crawler...");

    // Normalize URL
    let normalizedUrl = websiteUrl;
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Call Apify Website Content Crawler
    // Using run-sync-get-dataset-items for synchronous execution
    const apifyResponse = await fetch(
      `https://api.apify.com/v2/acts/apify~website-content-crawler/run-sync-get-dataset-items?token=${apifyKeyData.api_key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls: [{ url: normalizedUrl }],
          maxCrawlPages: 10,
          maxCrawlDepth: 2,
          crawlerType: "playwright:firefox",
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

    const crawledData = await apifyResponse.json();
    console.log(`[crawl-hotel-website] Crawl completed. Got ${Array.isArray(crawledData) ? crawledData.length : 0} pages`);

    // Process and summarize the crawled content
    const processedContent = Array.isArray(crawledData) ? crawledData.map((page: any) => ({
      url: page.url,
      title: page.metadata?.title || page.title || '',
      description: page.metadata?.description || '',
      text: page.text?.substring(0, 5000) || '', // Limit text per page
    })) : [];

    // Save result to database
    const { error: updateError } = await supabase.from('hotel_website_data').update({
      crawled_content: processedContent,
      crawled_at: new Date().toISOString(),
      status: 'completed',
      error_message: null,
    }).eq('hotel_id', hotelId);

    if (updateError) {
      console.error("[crawl-hotel-website] Error saving results:", updateError);
      throw new Error("Error saving crawl results");
    }

    console.log("[crawl-hotel-website] Successfully saved crawl results");

    return new Response(JSON.stringify({ 
      success: true, 
      pagesCount: processedContent.length,
      data: processedContent 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

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
