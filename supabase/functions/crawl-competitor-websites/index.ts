import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to call Manus API directly for competitor analysis
async function callManusForCompetitor(
  competitorUrl: string,
  prompt: string,
  manusApiKey: string,
  hotelId: string,
  competitorNumber: number,
  supabase: any
): Promise<{ taskId: string; success: boolean; error?: string }> {
  try {
    console.log(`[crawl-competitor-websites] Calling Manus API for competitor ${competitorNumber}: ${competitorUrl}`);

    const fullPrompt = `${prompt}

Site do Concorrente para Análise: ${competitorUrl}

Acesse o site acima e realize a análise completa conforme as instruções. Navegue pelo site, analise todas as páginas relevantes, e forneça uma análise detalhada.`;

    const response = await fetch("https://api.manus.ai/v1/tasks", {
      method: "POST",
      headers: {
        "API_KEY": manusApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: fullPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[crawl-competitor-websites] Manus API error:`, response.status, errorText);
      return { taskId: '', success: false, error: `Manus API error: ${response.status}` };
    }

    const data = await response.json();
    const taskId = data.task_id || data.id;

    if (!taskId) {
      console.error("[crawl-competitor-websites] No task_id in Manus response");
      return { taskId: '', success: false, error: 'No task_id in Manus response' };
    }

    console.log(`[crawl-competitor-websites] Manus task created: ${taskId}`);

    // Save task ID to database
    await supabase.from('hotel_competitor_data').update({
      manus_task_id: taskId,
      status: 'completed', // Crawling is "done" - Manus handles it
      analysis_status: 'processing_manus',
      llm_model_used: 'manus/agent-1.5',
    }).eq('hotel_id', hotelId).eq('competitor_number', competitorNumber);

    return { taskId, success: true };

  } catch (error) {
    console.error("[crawl-competitor-websites] Error calling Manus:", error);
    return { taskId: '', success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Helper function to call LLM for competitor analysis (non-Manus models)
async function generateCompetitorAnalysis(
  crawledContent: any[],
  competitorUrl: string,
  prompt: string,
  llmModel: string,
  lovableApiKey: string,
  supabase: any
): Promise<{ analysis: string; success: boolean; error?: string }> {
  
  // Build context from crawled content
  let contentContext = `## Conteúdo extraído do site concorrente: ${competitorUrl}\n\n`;
  for (const page of crawledContent) {
    contentContext += `### ${page.title || 'Página'}\n`;
    contentContext += `URL: ${page.url}\n`;
    if (page.description) {
      contentContext += `Descrição: ${page.description}\n`;
    }
    if (page.text) {
      contentContext += `Conteúdo:\n${page.text}\n\n`;
    }
  }

  const userPrompt = `Analise o seguinte conteúdo extraído do site de um hotel concorrente e forneça uma análise detalhada conforme as instruções:

${contentContext}

Por favor, forneça uma análise profissional em português do Brasil.`;

  try {
    // Check if it's a Lovable AI model
    const isLovableAIModel = llmModel.startsWith('lovable/') || 
                              llmModel.startsWith('google/') || 
                              llmModel.startsWith('openai/');
    
    if (isLovableAIModel) {
      console.log(`[crawl-competitor-websites] Calling Lovable AI with model: ${llmModel}`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: llmModel,
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: userPrompt }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[crawl-competitor-websites] Lovable AI error:", response.status, errorText);
        
        if (response.status === 429) {
          return { analysis: '', success: false, error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' };
        }
        if (response.status === 402) {
          return { analysis: '', success: false, error: 'Créditos insuficientes. Adicione créditos na sua conta.' };
        }
        
        return { analysis: '', success: false, error: `Lovable AI error: ${response.status}` };
      }

      const aiData = await response.json();
      const analysis = aiData.choices?.[0]?.message?.content || "";
      return { analysis, success: true };
      
    } else if (llmModel.startsWith('anthropic/')) {
      // Use Anthropic/Claude directly with API key from database
      const { data: apiKeyData, error: keyError } = await supabase
        .from('api_keys')
        .select('api_key')
        .eq('key_type', 'anthropic')
        .eq('is_active', true)
        .maybeSingle();

      if (keyError || !apiKeyData) {
        return { analysis: '', success: false, error: 'No active Anthropic API key found' };
      }

      const modelName = llmModel.replace('anthropic/', '');
      console.log(`[crawl-competitor-websites] Calling Anthropic with model: ${modelName}`);

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKeyData.api_key,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 4096,
          system: prompt,
          messages: [
            { role: "user", content: userPrompt }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[crawl-competitor-websites] Anthropic error:", response.status, errorText);
        return { analysis: '', success: false, error: `Anthropic API error: ${response.status}` };
      }

      const aiData = await response.json();
      const analysis = aiData.content?.[0]?.text || "";
      return { analysis, success: true };
      
    } else {
      return { analysis: '', success: false, error: `Unsupported LLM model: ${llmModel}` };
    }
  } catch (error) {
    console.error("[crawl-competitor-websites] Error generating analysis:", error);
    return { analysis: '', success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelId } = await req.json();
    
    console.log(`[crawl-competitor-websites] Starting for hotel ${hotelId}`);

    if (!hotelId) {
      throw new Error("hotelId is required");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
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

    // Build list of competitors to analyze
    const competitors: { url: string; number: number }[] = [];
    if (hotel.competitor_site_1) competitors.push({ url: hotel.competitor_site_1, number: 1 });
    if (hotel.competitor_site_2) competitors.push({ url: hotel.competitor_site_2, number: 2 });
    if (hotel.competitor_site_3) competitors.push({ url: hotel.competitor_site_3, number: 3 });

    if (competitors.length === 0) {
      throw new Error("Nenhum site de concorrente configurado nos Dados Básicos do hotel.");
    }

    console.log(`[crawl-competitor-websites] Found ${competitors.length} competitor(s)`);

    // Fetch research settings for LLM analysis settings
    const { data: researchSettings } = await supabase
      .from('research_settings')
      .select('competitor_max_pages, competitor_max_depth, competitor_crawler_type, competitor_prompt, competitor_llm_model')
      .limit(1)
      .maybeSingle();

    const competitorPrompt = researchSettings?.competitor_prompt || 'Você é um especialista em análise competitiva do setor hoteleiro. Analise o conteúdo do site deste hotel concorrente e forneça insights sobre: posicionamento de marca, diferenciais, público-alvo aparente, estratégias de marketing visíveis, e pontos fortes/fracos.';
    const llmModel = researchSettings?.competitor_llm_model || 'google/gemini-3-pro-preview';

    console.log(`[crawl-competitor-websites] Using llmModel=${llmModel}`);

    // Check if using Manus model
    const isManusModel = llmModel.startsWith('manus/');

    if (isManusModel) {
      // ===== MANUS FLOW: Skip Apify, send URL directly to Manus =====
      console.log("[crawl-competitor-websites] Using Manus model - skipping Apify crawl");

      // Fetch Manus API key
      const { data: manusKeyData, error: manusKeyError } = await supabase
        .from('api_keys')
        .select('api_key')
        .or('key_type.eq.manus,name.ilike.%manus%')
        .eq('is_active', true)
        .maybeSingle();

      if (manusKeyError || !manusKeyData?.api_key) {
        console.error("[crawl-competitor-websites] No active Manus API key found");
        
        for (const comp of competitors) {
          await supabase.from('hotel_competitor_data').upsert({
            hotel_id: hotelId,
            competitor_url: comp.url,
            competitor_number: comp.number,
            status: 'error',
            analysis_status: 'error',
            error_message: 'Nenhuma API key do Manus encontrada. Adicione uma nas Configurações.',
          }, { onConflict: 'hotel_id,competitor_number' });
        }
        
        throw new Error("No active Manus API key found. Please add one in Settings.");
      }

      // Update status to 'generating' for all competitors
      for (const comp of competitors) {
        await supabase.from('hotel_competitor_data').upsert({
          hotel_id: hotelId,
          competitor_url: comp.url,
          competitor_number: comp.number,
          status: 'generating',
          analysis_status: 'generating',
          error_message: null,
          manus_task_id: null,
        }, { onConflict: 'hotel_id,competitor_number' });
      }

      const results: { competitorNumber: number; success: boolean; taskId?: string; error?: string }[] = [];

      // Call Manus for each competitor
      for (const comp of competitors) {
        const result = await callManusForCompetitor(
          comp.url,
          competitorPrompt,
          manusKeyData.api_key,
          hotelId,
          comp.number,
          supabase
        );

        if (result.success) {
          results.push({ competitorNumber: comp.number, success: true, taskId: result.taskId });
        } else {
          await supabase.from('hotel_competitor_data').update({
            status: 'error',
            analysis_status: 'error',
            error_message: result.error,
          }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
          
          results.push({ competitorNumber: comp.number, success: false, error: result.error });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`[crawl-competitor-websites] Manus tasks created: ${successCount}/${competitors.length}`);

      return new Response(JSON.stringify({ 
        success: successCount > 0, 
        mode: 'manus',
        results 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      // ===== TRADITIONAL FLOW: Apify crawl + LLM analysis =====
      console.log("[crawl-competitor-websites] Using traditional Apify + LLM flow");

      // Update status to 'crawling' for all competitors
      for (const comp of competitors) {
        await supabase.from('hotel_competitor_data').upsert({
          hotel_id: hotelId,
          competitor_url: comp.url,
          competitor_number: comp.number,
          status: 'crawling',
          analysis_status: 'pending',
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
        
        for (const comp of competitors) {
          await supabase.from('hotel_competitor_data').update({
            status: 'error',
            error_message: 'Nenhuma API key do Apify encontrada. Adicione uma nas Configurações ou use o modelo Manus.',
          }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
        }
        
        throw new Error("No active Apify API key found. Please add one in Settings or use Manus model.");
      }

      console.log("[crawl-competitor-websites] Found Apify API key, starting crawls...");

      const maxPages = researchSettings?.competitor_max_pages || 8;
      const maxDepth = researchSettings?.competitor_max_depth || 2;
      const crawlerType = researchSettings?.competitor_crawler_type || 'playwright:firefox';

      console.log(`[crawl-competitor-websites] Using settings: maxPages=${maxPages}, maxDepth=${maxDepth}, crawlerType=${crawlerType}`);

      const results: { competitorNumber: number; success: boolean; pagesCount?: number; analysisGenerated?: boolean; error?: string }[] = [];

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
            
            // Parse error message for better feedback
            let errorMessage = `Erro na API do Apify: ${apifyResponse.status}`;
            try {
              const errorJson = JSON.parse(errorText);
              if (errorJson.error?.message) {
                errorMessage = errorJson.error.message;
                if (errorMessage.includes('Monthly usage hard limit exceeded')) {
                  errorMessage = 'Limite mensal do Apify excedido. Use o modelo Manus ou aguarde o próximo ciclo.';
                }
              }
            } catch {}
            
            await supabase.from('hotel_competitor_data').update({
              status: 'error',
              error_message: errorMessage,
            }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
            
            results.push({ competitorNumber: comp.number, success: false, error: errorMessage });
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

          // Save crawled content and update status
          await supabase.from('hotel_competitor_data').update({
            crawled_content: processedContent,
            crawled_at: new Date().toISOString(),
            status: 'completed',
            analysis_status: 'generating',
            error_message: null,
          }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);

          // Generate LLM analysis
          console.log(`[crawl-competitor-websites] Generating analysis for competitor ${comp.number}...`);
          
          if (LOVABLE_API_KEY && processedContent.length > 0) {
            const analysisResult = await generateCompetitorAnalysis(
              processedContent,
              comp.url,
              competitorPrompt,
              llmModel,
              LOVABLE_API_KEY,
              supabase
            );

            if (analysisResult.success) {
              await supabase.from('hotel_competitor_data').update({
                generated_analysis: analysisResult.analysis,
                analysis_status: 'completed',
                llm_model_used: llmModel,
              }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
              
              console.log(`[crawl-competitor-websites] Analysis generated for competitor ${comp.number}`);
              results.push({ competitorNumber: comp.number, success: true, pagesCount: processedContent.length, analysisGenerated: true });
            } else {
              await supabase.from('hotel_competitor_data').update({
                analysis_status: 'error',
                error_message: analysisResult.error,
              }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
              
              console.error(`[crawl-competitor-websites] Analysis error for competitor ${comp.number}:`, analysisResult.error);
              results.push({ competitorNumber: comp.number, success: true, pagesCount: processedContent.length, analysisGenerated: false, error: analysisResult.error });
            }
          } else {
            await supabase.from('hotel_competitor_data').update({
              analysis_status: 'skipped',
            }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
            
            results.push({ competitorNumber: comp.number, success: true, pagesCount: processedContent.length, analysisGenerated: false });
          }

        } catch (compError) {
          console.error(`[crawl-competitor-websites] Error for competitor ${comp.number}:`, compError);
          
          await supabase.from('hotel_competitor_data').update({
            status: 'error',
            error_message: compError instanceof Error ? compError.message : 'Unknown error',
          }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
          
          results.push({ competitorNumber: comp.number, success: false, error: compError instanceof Error ? compError.message : 'Unknown error' });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const analysisCount = results.filter(r => r.analysisGenerated).length;
      console.log(`[crawl-competitor-websites] Completed. ${successCount}/${competitors.length} crawled, ${analysisCount}/${competitors.length} analyzed`);

      return new Response(JSON.stringify({ 
        success: successCount > 0,
        mode: 'apify',
        results 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
