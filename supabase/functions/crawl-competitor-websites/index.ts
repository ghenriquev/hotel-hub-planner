// VERSION: 2.0.0 - Uses direct API keys instead of Lovable AI Gateway
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: fetch API key from database by key_type
async function getApiKey(supabase: any, keyType: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('key_type', keyType)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data) return null;
  return data.api_key;
}

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

    const requestBody = JSON.stringify({
      prompt: fullPrompt,
      agentProfile: "manus-1.5",
    });

    console.log(`[crawl-competitor-websites] Trying Manus API with API_KEY header...`);
    let response = await fetch("https://api.manus.ai/v1/tasks", {
      method: "POST",
      headers: {
        "API_KEY": manusApiKey,
        "Content-Type": "application/json",
      },
      body: requestBody,
    });

    if (response.status === 401) {
      console.log(`[crawl-competitor-websites] API_KEY failed with 401, trying Authorization Bearer...`);
      response = await fetch("https://api.manus.ai/v1/tasks", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${manusApiKey}`,
          "Content-Type": "application/json",
        },
        body: requestBody,
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[crawl-competitor-websites] Manus API error: ${response.status}`, errorText);
      const errorMsg = `Erro Manus API: ${response.status} - ${errorText.substring(0, 200)}`;
      await supabase.from('hotel_competitor_data').update({
        status: 'error', analysis_status: 'error', error_message: errorMsg,
      }).eq('hotel_id', hotelId).eq('competitor_number', competitorNumber);
      return { taskId: '', success: false, error: errorMsg };
    }

    const data = await response.json();
    const taskId = data.task_id || data.id;

    if (!taskId) {
      const errorMsg = 'Manus não retornou task_id';
      await supabase.from('hotel_competitor_data').update({
        status: 'error', analysis_status: 'error', error_message: errorMsg,
      }).eq('hotel_id', hotelId).eq('competitor_number', competitorNumber);
      return { taskId: '', success: false, error: errorMsg };
    }

    await supabase.from('hotel_competitor_data').update({
      manus_task_id: taskId,
      status: 'completed',
      analysis_status: 'processing_manus',
      llm_model_used: 'manus/agent-1.5',
    }).eq('hotel_id', hotelId).eq('competitor_number', competitorNumber);

    return { taskId, success: true };

  } catch (error) {
    console.error("[crawl-competitor-websites] Error calling Manus:", error);
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    await supabase.from('hotel_competitor_data').update({
      status: 'error', analysis_status: 'error', error_message: errorMsg,
    }).eq('hotel_id', hotelId).eq('competitor_number', competitorNumber);
    return { taskId: '', success: false, error: errorMsg };
  }
}

// Helper function to call LLM for competitor analysis using direct API keys
async function generateCompetitorAnalysis(
  crawledContent: any[],
  competitorUrl: string,
  prompt: string,
  llmModel: string,
  supabase: any
): Promise<{ analysis: string; success: boolean; error?: string }> {
  
  let contentContext = `## Conteúdo extraído do site concorrente: ${competitorUrl}\n\n`;
  for (const page of crawledContent) {
    contentContext += `### ${page.title || 'Página'}\nURL: ${page.url}\n`;
    if (page.description) contentContext += `Descrição: ${page.description}\n`;
    if (page.text) contentContext += `Conteúdo:\n${page.text}\n\n`;
  }

  const userPrompt = `Analise o seguinte conteúdo extraído do site de um hotel concorrente e forneça uma análise detalhada conforme as instruções:

${contentContext}

Por favor, forneça uma análise profissional em português do Brasil.`;

  try {
    const prefix = llmModel.split('/')[0];
    const modelName = llmModel.replace(`${prefix}/`, '');

    if (prefix === 'google') {
      const apiKey = await getApiKey(supabase, 'google');
      if (!apiKey) return { analysis: '', success: false, error: 'Nenhuma API Key do Google ativa encontrada.' };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "system", content: prompt }, { role: "user", content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { analysis: '', success: false, error: `Google AI error: ${response.status}` };
      }

      const aiData = await response.json();
      return { analysis: aiData.choices?.[0]?.message?.content || "", success: true };

    } else if (prefix === 'openai') {
      const apiKey = await getApiKey(supabase, 'openai');
      if (!apiKey) return { analysis: '', success: false, error: 'Nenhuma API Key da OpenAI ativa encontrada.' };

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "system", content: prompt }, { role: "user", content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { analysis: '', success: false, error: `OpenAI error: ${response.status}` };
      }

      const aiData = await response.json();
      return { analysis: aiData.choices?.[0]?.message?.content || "", success: true };

    } else if (prefix === 'anthropic') {
      const apiKey = await getApiKey(supabase, 'anthropic');
      if (!apiKey) return { analysis: '', success: false, error: 'Nenhuma API Key da Anthropic ativa encontrada.' };

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 4096,
          system: prompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { analysis: '', success: false, error: `Anthropic error: ${response.status}` };
      }

      const aiData = await response.json();
      return { analysis: aiData.content?.[0]?.text || "", success: true };

    } else {
      return { analysis: '', success: false, error: `Modelo LLM não suportado: ${llmModel}` };
    }
  } catch (error) {
    console.error("[crawl-competitor-websites] Error generating analysis:", error);
    return { analysis: '', success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelId } = await req.json();
    
    console.log(`[crawl-competitor-websites] Starting for hotel ${hotelId}`);

    if (!hotelId) throw new Error("hotelId is required");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase configuration");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch competitors
    const { data: competitorRecords, error: competitorError } = await supabase
      .from('hotel_competitor_data')
      .select('competitor_url, competitor_number')
      .eq('hotel_id', hotelId)
      .order('competitor_number', { ascending: true });

    if (competitorError) throw new Error("Error fetching competitors");

    const competitors: { url: string; number: number }[] = (competitorRecords || [])
      .filter(c => c.competitor_url && c.competitor_url.trim() !== '')
      .map(c => ({ url: c.competitor_url, number: c.competitor_number }));

    if (competitors.length === 0) throw new Error("Nenhum site de concorrente configurado nos Dados Básicos do hotel.");

    console.log(`[crawl-competitor-websites] Found ${competitors.length} competitor(s)`);

    // Fetch research settings
    const { data: researchSettings } = await supabase
      .from('research_settings')
      .select('competitor_max_pages, competitor_max_depth, competitor_crawler_type, competitor_prompt, competitor_llm_model')
      .limit(1)
      .maybeSingle();

    const competitorPrompt = researchSettings?.competitor_prompt || 'Você é um especialista em análise competitiva do setor hoteleiro. Analise o conteúdo do site deste hotel concorrente e forneça insights.';
    const llmModel = researchSettings?.competitor_llm_model || 'google/gemini-2.5-flash';

    console.log(`[crawl-competitor-websites] Using llmModel=${llmModel}`);

    const isManusModel = llmModel.startsWith('manus/');

    if (isManusModel) {
      // ===== MANUS FLOW =====
      console.log("[crawl-competitor-websites] Using Manus model - skipping Apify crawl");

      const { data: manusKeyData, error: manusKeyError } = await supabase
        .from('api_keys')
        .select('api_key')
        .or('key_type.eq.manus,name.ilike.%manus%')
        .eq('is_active', true)
        .maybeSingle();

      if (manusKeyError || !manusKeyData?.api_key) {
        for (const comp of competitors) {
          await supabase.from('hotel_competitor_data').upsert({
            hotel_id: hotelId, competitor_url: comp.url, competitor_number: comp.number,
            status: 'error', analysis_status: 'error',
            error_message: 'Nenhuma API key do Manus encontrada.',
          }, { onConflict: 'hotel_id,competitor_number' });
        }
        throw new Error("No active Manus API key found.");
      }

      for (const comp of competitors) {
        await supabase.from('hotel_competitor_data').upsert({
          hotel_id: hotelId, competitor_url: comp.url, competitor_number: comp.number,
          status: 'generating', analysis_status: 'generating',
          error_message: null, manus_task_id: null,
        }, { onConflict: 'hotel_id,competitor_number' });
      }

      const results: any[] = [];
      for (const comp of competitors) {
        const result = await callManusForCompetitor(comp.url, competitorPrompt, manusKeyData.api_key, hotelId, comp.number, supabase);
        if (result.success) {
          results.push({ competitorNumber: comp.number, success: true, taskId: result.taskId });
        } else {
          await supabase.from('hotel_competitor_data').update({
            status: 'error', analysis_status: 'error', error_message: result.error,
          }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
          results.push({ competitorNumber: comp.number, success: false, error: result.error });
        }
      }

      return new Response(JSON.stringify({ success: results.some(r => r.success), mode: 'manus', results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      // ===== TRADITIONAL FLOW: Apify crawl + LLM analysis =====
      console.log("[crawl-competitor-websites] Using traditional Apify + LLM flow");

      for (const comp of competitors) {
        await supabase.from('hotel_competitor_data').upsert({
          hotel_id: hotelId, competitor_url: comp.url, competitor_number: comp.number,
          status: 'crawling', analysis_status: 'pending', error_message: null,
        }, { onConflict: 'hotel_id,competitor_number' });
      }

      // Fetch Apify API Key
      const { data: apifyKeyData, error: keyError } = await supabase
        .from('api_keys')
        .select('api_key')
        .eq('is_active', true)
        .or('name.ilike.%apify%,name.ilike.%apfy%,key_type.ilike.%apify%')
        .maybeSingle();

      if (keyError || !apifyKeyData?.api_key) {
        for (const comp of competitors) {
          await supabase.from('hotel_competitor_data').update({
            status: 'error', error_message: 'Nenhuma API key do Apify encontrada.',
          }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
        }
        throw new Error("No active Apify API key found.");
      }

      const maxPages = researchSettings?.competitor_max_pages || 8;
      const maxDepth = researchSettings?.competitor_max_depth || 2;
      const crawlerType = researchSettings?.competitor_crawler_type || 'playwright:firefox';

      const results: any[] = [];

      for (const comp of competitors) {
        try {
          let normalizedUrl = comp.url;
          if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = `https://${normalizedUrl}`;
          }

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
                proxyConfiguration: { useApifyProxy: true },
              }),
            }
          );

          if (!apifyResponse.ok) {
            const errorText = await apifyResponse.text();
            let errorMessage = `Erro na API do Apify: ${apifyResponse.status}`;
            try {
              const errorJson = JSON.parse(errorText);
              if (errorJson.error?.message) {
                errorMessage = errorJson.error.message;
                if (errorMessage.includes('Monthly usage hard limit exceeded')) {
                  errorMessage = 'Limite mensal do Apify excedido.';
                }
              }
            } catch {}
            
            await supabase.from('hotel_competitor_data').update({
              status: 'error', error_message: errorMessage,
            }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
            results.push({ competitorNumber: comp.number, success: false, error: errorMessage });
            continue;
          }

          const crawledData = await apifyResponse.json();
          const processedContent = Array.isArray(crawledData) ? crawledData.map((page: any) => ({
            url: page.url,
            title: page.metadata?.title || page.title || '',
            description: page.metadata?.description || '',
            text: page.text?.substring(0, 5000) || '',
          })) : [];

          await supabase.from('hotel_competitor_data').update({
            crawled_content: processedContent,
            crawled_at: new Date().toISOString(),
            status: 'completed',
            analysis_status: 'generating',
            error_message: null,
          }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);

          // Generate LLM analysis using API keys
          if (processedContent.length > 0) {
            const analysisResult = await generateCompetitorAnalysis(
              processedContent, comp.url, competitorPrompt, llmModel, supabase
            );

            if (analysisResult.success) {
              await supabase.from('hotel_competitor_data').update({
                generated_analysis: analysisResult.analysis,
                analysis_status: 'completed',
                llm_model_used: llmModel,
              }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
              results.push({ competitorNumber: comp.number, success: true, pagesCount: processedContent.length, analysisGenerated: true });
            } else {
              await supabase.from('hotel_competitor_data').update({
                analysis_status: 'error', error_message: analysisResult.error,
              }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
              results.push({ competitorNumber: comp.number, success: true, pagesCount: processedContent.length, analysisGenerated: false, error: analysisResult.error });
            }
          } else {
            await supabase.from('hotel_competitor_data').update({
              analysis_status: 'skipped',
            }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
            results.push({ competitorNumber: comp.number, success: true, pagesCount: processedContent.length, analysisGenerated: false });
          }

        } catch (compError) {
          await supabase.from('hotel_competitor_data').update({
            status: 'error', error_message: compError instanceof Error ? compError.message : 'Unknown error',
          }).eq('hotel_id', hotelId).eq('competitor_number', comp.number);
          results.push({ competitorNumber: comp.number, success: false, error: compError instanceof Error ? compError.message : 'Unknown error' });
        }
      }

      return new Response(JSON.stringify({ success: results.some(r => r.success), mode: 'apify', results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    console.error("[crawl-competitor-websites] Error:", error);
    return new Response(JSON.stringify({ 
      success: false, error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
