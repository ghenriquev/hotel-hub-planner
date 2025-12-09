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
    const { hotelId } = await req.json();
    
    console.log(`[crawl-competitor-websites] Starting crawl for hotel ${hotelId}`);

    if (!hotelId) {
      throw new Error("hotelId is required");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch hotel data to get competitor URLs
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('competitor_site_1, competitor_site_2, competitor_site_3')
      .eq('id', hotelId)
      .maybeSingle();

    if (hotelError || !hotel) {
      throw new Error("Hotel not found");
    }

    // Build list of competitors to crawl
    const competitors: { url: string; number: number }[] = [];
    if (hotel.competitor_site_1) competitors.push({ url: hotel.competitor_site_1, number: 1 });
    if (hotel.competitor_site_2) competitors.push({ url: hotel.competitor_site_2, number: 2 });
    if (hotel.competitor_site_3) competitors.push({ url: hotel.competitor_site_3, number: 3 });

    if (competitors.length === 0) {
      throw new Error("Nenhum site de concorrente configurado nos Dados Básicos do hotel.");
    }

    console.log(`[crawl-competitor-websites] Found ${competitors.length} competitor(s) to crawl`);

    // Update status to 'crawling' for all competitors
    for (const comp of competitors) {
      await supabase.from('hotel_competitor_data').upsert({
        hotel_id: hotelId,
        competitor_url: comp.url,
        competitor_number: comp.number,
        status: 'crawling',
        error_message: null,
      }, { onConflict: 'hotel_id,competitor_number' });
    }

    // Fetch Apify API Key
    const { data: apifyKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('is_active', true)
      .or('name.ilike.%apify%,name.ilike.%apfy%,key_type.ilike.%apify%')
      .maybeSingle();

    if (keyError) {
      console.error("[crawl-competitor-websites] Error fetching API key:", keyError);
      throw new Error("Error fetching Apify API key");
    }

    if (!apifyKeyData?.api_key) {
      console.error("[crawl-competitor-websites] No active Apify API key found");
      
      // Update all competitors with error
      for (const comp of competitors) {
        await supabase.from('hotel_competitor_data').update({
          status: 'error',
          error_message: 'Nenhuma API key do Apify encontrada. Adicione uma nas Configurações.',
        }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
      }
      
      throw new Error("No active Apify API key found. Please add one in Settings.");
    }

    console.log("[crawl-competitor-websites] Found Apify API key, starting crawls...");

    // Fetch research settings for crawler configuration
    const { data: researchSettings } = await supabase
      .from('research_settings')
      .select('competitor_max_pages, competitor_max_depth, competitor_crawler_type')
      .limit(1)
      .maybeSingle();

    const maxPages = researchSettings?.competitor_max_pages || 8;
    const maxDepth = researchSettings?.competitor_max_depth || 2;
    const crawlerType = researchSettings?.competitor_crawler_type || 'playwright:firefox';

    console.log(`[crawl-competitor-websites] Using settings: maxPages=${maxPages}, maxDepth=${maxDepth}, crawlerType=${crawlerType}`);

    const results: { competitorNumber: number; success: boolean; pagesCount?: number; error?: string }[] = [];

    // Crawl each competitor
    for (const comp of competitors) {
      try {
        console.log(`[crawl-competitor-websites] Crawling competitor ${comp.number}: ${comp.url}`);

        // Normalize URL
        let normalizedUrl = comp.url;
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
          normalizedUrl = `https://${normalizedUrl}`;
        }

        // Call Apify Website Content Crawler
        const apifyResponse = await fetch(
          `https://api.apify.com/v2/acts/apify~website-content-crawler/run-sync-get-dataset-items?token=${apifyKeyData.api_key}`,
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
          console.error(`[crawl-competitor-websites] Apify error for competitor ${comp.number}:`, errorText);
          
          await supabase.from('hotel_competitor_data').update({
            status: 'error',
            error_message: `Erro na API do Apify: ${apifyResponse.status}`,
          }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
          
          results.push({ competitorNumber: comp.number, success: false, error: `API error: ${apifyResponse.status}` });
          continue;
        }

        const crawledData = await apifyResponse.json();
        console.log(`[crawl-competitor-websites] Competitor ${comp.number}: Got ${Array.isArray(crawledData) ? crawledData.length : 0} pages`);

        // Process crawled content
        const processedContent = Array.isArray(crawledData) ? crawledData.map((page: any) => ({
          url: page.url,
          title: page.metadata?.title || page.title || '',
          description: page.metadata?.description || '',
          text: page.text?.substring(0, 5000) || '',
        })) : [];

        // Save result
        await supabase.from('hotel_competitor_data').update({
          crawled_content: processedContent,
          crawled_at: new Date().toISOString(),
          status: 'completed',
          error_message: null,
        }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);

        results.push({ competitorNumber: comp.number, success: true, pagesCount: processedContent.length });

      } catch (compError) {
        console.error(`[crawl-competitor-websites] Error crawling competitor ${comp.number}:`, compError);
        
        await supabase.from('hotel_competitor_data').update({
          status: 'error',
          error_message: compError instanceof Error ? compError.message : 'Unknown error',
        }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
        
        results.push({ competitorNumber: comp.number, success: false, error: compError instanceof Error ? compError.message : 'Unknown error' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[crawl-competitor-websites] Completed. ${successCount}/${competitors.length} successful`);

    return new Response(JSON.stringify({ 
      success: successCount > 0, 
      results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[crawl-competitor-websites] Error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
