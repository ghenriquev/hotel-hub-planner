// VERSION: 5.0.0 - Background processing with EdgeRuntime.waitUntil for faster response
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNCTION_VERSION = "5.0.0";

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

// Helper: call LLM based on model prefix using API keys from database
async function callLLM(
  supabase: any,
  llmModel: string,
  systemPrompt: string,
  userPrompt: string
): Promise<{ result: string; success: boolean; error?: string; status?: number }> {
  const prefix = llmModel.split('/')[0];
  const modelName = llmModel.replace(`${prefix}/`, '');

  if (prefix === 'google') {
    const apiKey = await getApiKey(supabase, 'google');
    if (!apiKey) return { result: '', success: false, error: 'Nenhuma API Key do Google ativa encontrada. Adicione uma em Configurações > API Keys.' };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LLM] Google AI error: ${response.status}`, errorText);
      return { result: '', success: false, error: `Google AI error: ${response.status} - ${errorText.substring(0, 200)}`, status: response.status };
    }

    const aiData = await response.json();
    return { result: aiData.choices?.[0]?.message?.content || "", success: true };

  } else if (prefix === 'openai') {
    const apiKey = await getApiKey(supabase, 'openai');
    if (!apiKey) return { result: '', success: false, error: 'Nenhuma API Key da OpenAI ativa encontrada. Adicione uma em Configurações > API Keys.' };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LLM] OpenAI error: ${response.status}`, errorText);
      return { result: '', success: false, error: `OpenAI error: ${response.status} - ${errorText.substring(0, 200)}`, status: response.status };
    }

    const aiData = await response.json();
    return { result: aiData.choices?.[0]?.message?.content || "", success: true };

  } else if (prefix === 'anthropic') {
    const apiKey = await getApiKey(supabase, 'anthropic');
    if (!apiKey) return { result: '', success: false, error: 'Nenhuma API Key da Anthropic ativa encontrada. Adicione uma em Configurações > API Keys.' };

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
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[LLM] Anthropic error: ${response.status}`, errorText);
      return { result: '', success: false, error: `Anthropic error: ${response.status} - ${errorText.substring(0, 200)}`, status: response.status };
    }

    const aiData = await response.json();
    return { result: aiData.content?.[0]?.text || "", success: true };

  } else {
    return { result: '', success: false, error: `Modelo LLM não suportado: ${llmModel}` };
  }
}

// Helper: call LLM with streaming support (returns raw Response)
async function callLLMStreaming(
  supabase: any,
  llmModel: string,
  systemPrompt: string,
  messages: any[]
): Promise<{ response: Response | null; success: boolean; error?: string; status?: number }> {
  const prefix = llmModel.split('/')[0];
  const modelName = llmModel.replace(`${prefix}/`, '');

  if (prefix === 'google') {
    const apiKey = await getApiKey(supabase, 'google');
    if (!apiKey) return { response: null, success: false, error: 'Nenhuma API Key do Google ativa encontrada.' };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { response: null, success: false, error: `Google AI error: ${response.status}`, status: response.status };
    }
    return { response, success: true };

  } else if (prefix === 'openai') {
    const apiKey = await getApiKey(supabase, 'openai');
    if (!apiKey) return { response: null, success: false, error: 'Nenhuma API Key da OpenAI ativa encontrada.' };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { response: null, success: false, error: `OpenAI error: ${response.status}`, status: response.status };
    }
    return { response, success: true };

  } else if (prefix === 'anthropic') {
    // Anthropic streaming uses a different format - for simplicity, use non-streaming and wrap
    const apiKey = await getApiKey(supabase, 'anthropic');
    if (!apiKey) return { response: null, success: false, error: 'Nenhuma API Key da Anthropic ativa encontrada.' };

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
        stream: true,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { response: null, success: false, error: `Anthropic error: ${response.status}`, status: response.status };
    }
    return { response, success: true };

  } else {
    return { response: null, success: false, error: `Modelo LLM não suportado: ${llmModel}` };
  }
}

// Helper function to poll Gamma API for generation status
async function pollGammaGeneration(generationId: string, apiKey: string, maxAttempts = 60): Promise<string | null> {
  console.log(`[analyze-module] Polling Gamma generation ${generationId}...`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const response = await fetch(`https://public-api.gamma.app/v1.0/generations/${generationId}`, {
      headers: { "X-API-KEY": apiKey },
    });
    
    if (!response.ok) {
      console.error(`[analyze-module] Gamma poll error: ${response.status}`);
      continue;
    }
    
    const data = await response.json();
    console.log(`[analyze-module] Gamma status: ${data.status}, attempt ${attempt + 1}/${maxAttempts}`);
    
    if (data.status === "completed") {
      if (data.gammaUrl) return data.gammaUrl;
    }
    
    if (data.status === "failed" || data.status === "error") {
      console.error(`[analyze-module] Gamma generation failed:`, data);
      return null;
    }
  }
  
  console.error(`[analyze-module] Gamma polling timeout after ${maxAttempts} attempts`);
  return null;
}

serve(async (req) => {
  console.log(`[analyze-module] ===== FUNCTION VERSION ${FUNCTION_VERSION} =====`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { hotelId, moduleId, materials } = requestBody ?? {};
    
    console.log(`[analyze-module] v${FUNCTION_VERSION} - Starting analysis for hotel: ${hotelId}, module: ${moduleId}`);
    
    if (!hotelId || moduleId === undefined || moduleId === null) {
      throw new Error("hotelId and moduleId are required");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update status to generating immediately
    await supabase
      .from('agent_results')
      .upsert({
        hotel_id: hotelId,
        module_id: moduleId,
        status: 'generating',
        result: null,
        presentation_url: null,
        generated_at: null,
      }, { onConflict: 'hotel_id,module_id' });

    // Get agent configuration to check if it's Manus (needs special handling)
    const { data: agentConfig, error: configError } = await supabase
      .from('agent_configs')
      .select('llm_model')
      .eq('module_id', moduleId)
      .maybeSingle();

    if (configError || !agentConfig) {
      await supabase.from('agent_results').upsert({
        hotel_id: hotelId,
        module_id: moduleId,
        status: 'error',
        result: `Configuração do agente não encontrada para módulo ${moduleId}`,
      }, { onConflict: 'hotel_id,module_id' });
      throw new Error(`No agent configuration found for module ${moduleId}`);
    }

    const llmModel = agentConfig.llm_model || 'google/gemini-2.5-flash';

    // For Manus models, handle synchronously (it already has its own async flow)
    if (llmModel.startsWith('manus/')) {
      const result = await processAnalysis(supabase, hotelId, moduleId, materials, req);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For all other models: process in background and return immediately
    const backgroundTask = processAnalysis(supabase, hotelId, moduleId, materials, req);
    
    // Use EdgeRuntime.waitUntil to keep the function alive for the background task
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(backgroundTask);
    } else {
      // Fallback: just fire and forget (the promise will keep executing)
      backgroundTask.catch(err => console.error("[analyze-module] Background task error:", err));
    }

    // Return immediately - UI will update via Realtime
    return new Response(JSON.stringify({ 
      success: true,
      async: true,
      message: "Análise iniciada em background. O resultado será atualizado automaticamente.",
      llmModelUsed: llmModel
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[analyze-module] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Main processing logic extracted to a separate async function
async function processAnalysis(
  supabase: any,
  hotelId: string,
  moduleId: number,
  materials: any,
  req: Request
): Promise<any> {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

    // Get full agent configuration
    const { data: agentConfig, error: configError } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('module_id', moduleId)
      .maybeSingle();

    if (configError) throw new Error(`Failed to get agent config: ${configError.message}`);
    if (!agentConfig) throw new Error(`No agent configuration found for module ${moduleId}`);

    const configuredMaterials = agentConfig.materials_config || ['manual', 'dados', 'transcricao'];
    const secondaryMaterials = agentConfig.secondary_materials_config || [];
    console.log(`[analyze-module] Using agent config: ${agentConfig.module_title}, model: ${agentConfig.llm_model || 'google/gemini-2.5-flash'}, primary materials: ${configuredMaterials.join(', ')}`);

    // Build context from materials - fetch all in parallel for speed
    let materialsContext = "";
    
    if (materials) {
      if (configuredMaterials.includes('manual') && materials.manualFuncionamentoUrl) {
        materialsContext += `\n\n## Manual de Funcionamento\nURL: ${materials.manualFuncionamentoUrl}\nNome: ${materials.manualFuncionamentoName || 'Não especificado'}`;
      }
      if (configuredMaterials.includes('dados') && materials.dadosHotelUrl) {
        materialsContext += `\n\n## Dados do Hotel\nURL: ${materials.dadosHotelUrl}\nNome: ${materials.dadosHotelName || 'Não especificado'}`;
      }
      if (configuredMaterials.includes('transcricao') && materials.transcricaoKickoffUrl) {
        materialsContext += `\n\n## Transcrição de Kickoff\nURL: ${materials.transcricaoKickoffUrl}\nNome: ${materials.transcricaoKickoffName || 'Não especificado'}`;
      }
    }

    // Fetch additional materials in parallel
    const parallelFetches: Promise<void>[] = [];

    if (configuredMaterials.includes('website')) {
      parallelFetches.push((async () => {
        const { data: websiteData } = await supabase
          .from('hotel_website_data')
          .select('crawled_content, website_url')
          .eq('hotel_id', hotelId)
          .eq('status', 'completed')
          .maybeSingle();
        if (websiteData?.crawled_content && Array.isArray(websiteData.crawled_content)) {
          materialsContext += `\n\n## Conteúdo do Site do Hotel (${websiteData.website_url})`;
          for (const page of websiteData.crawled_content) {
            materialsContext += `\n\n### ${page.title || 'Página'}\nURL: ${page.url}`;
            if (page.description) materialsContext += `\nDescrição: ${page.description}`;
            if (page.text) materialsContext += `\nConteúdo:\n${page.text.substring(0, 3000)}`;
          }
        }
      })());
    }

    if (configuredMaterials.includes('reviews')) {
      parallelFetches.push((async () => {
        const { data: reviewsMaterial } = await supabase
          .from('hotel_materials')
          .select('text_content')
          .eq('hotel_id', hotelId)
          .eq('material_type', 'reviews')
          .maybeSingle();
        if (reviewsMaterial?.text_content) {
          materialsContext += `\n\n## Avaliações Consolidadas (Últimos 24 Meses)\n${reviewsMaterial.text_content}`;
        }
      })());
    }

    if (configuredMaterials.includes('competitors')) {
      parallelFetches.push((async () => {
        const { data: competitorData } = await supabase
          .from('hotel_competitor_data')
          .select('competitor_url, competitor_number, generated_analysis, llm_model_used')
          .eq('hotel_id', hotelId)
          .eq('status', 'completed')
          .eq('analysis_status', 'completed')
          .order('competitor_number', { ascending: true });
        if (competitorData && competitorData.length > 0) {
          materialsContext += `\n\n## Análise dos Sites Concorrentes`;
          for (const competitor of competitorData) {
            materialsContext += `\n\n### Análise Concorrente ${competitor.competitor_number}: ${competitor.competitor_url}`;
            materialsContext += competitor.generated_analysis ? `\n\n${competitor.generated_analysis}` : `\n\nAnálise não disponível.`;
          }
        }
      })());
    }

    if (secondaryMaterials.length > 0) {
      parallelFetches.push((async () => {
        const { data: agentResults } = await supabase
          .from('agent_results')
          .select('module_id, result')
          .eq('hotel_id', hotelId)
          .eq('status', 'completed')
          .in('module_id', secondaryMaterials);
        if (agentResults && agentResults.length > 0) {
          const { data: agentTitles } = await supabase
            .from('agent_configs')
            .select('module_id, module_title')
            .in('module_id', agentResults.map((r: any) => r.module_id));
          const titleMap = new Map(agentTitles?.map((t: any) => [t.module_id, t.module_title]) || []);
          materialsContext += `\n\n---\n\n# MATERIAIS SECUNDÁRIOS (Resultados de Outros Agentes)\n`;
          for (const agentResult of agentResults) {
            const title = titleMap.get(agentResult.module_id) || `Agente ${agentResult.module_id}`;
            materialsContext += `\n\n## ${title}\n${agentResult.result}`;
          }
        }
      })());
    }

    // Wait for all parallel fetches
    await Promise.all(parallelFetches);

    if (!materialsContext) {
      materialsContext = "Nenhum material foi anexado para análise. Por favor, forneça uma análise baseada em boas práticas do setor hoteleiro.";
    }

    const systemPrompt = agentConfig.prompt;
    const userPrompt = `Analise os seguintes materiais do hotel e gere o resultado conforme as instruções:\n\n${materialsContext}\n\nPor favor, forneça uma análise detalhada e profissional em português do Brasil.`;
    const llmModel = agentConfig.llm_model || 'google/gemini-2.5-flash';

    // Check if Manus model - route to manus-agent
    if (llmModel.startsWith('manus/')) {
      console.log("[analyze-module] Routing to Manus Agent...");
      const forwardAuth = req.headers.get("authorization") || "";
      const forwardApikey = req.headers.get("apikey") || "";

      const manusResponse = await fetch(`${SUPABASE_URL}/functions/v1/manus-agent`, {
        method: "POST",
        headers: {
          ...(forwardAuth ? { Authorization: forwardAuth } : {}),
          ...(forwardApikey ? { apikey: forwardApikey } : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hotelId, moduleId, prompt: systemPrompt + "\n\n" + userPrompt, materials: materialsContext }),
      });

      if (!manusResponse.ok) {
        const errorText = await manusResponse.text();
        await supabase.from('agent_results').upsert({
          hotel_id: hotelId, module_id: moduleId, status: 'error',
          result: `Erro ao chamar Manus Agent: ${errorText.substring(0, 500)}`,
          generated_at: new Date().toISOString(),
        }, { onConflict: 'hotel_id,module_id' });
        throw new Error(`Manus agent error: ${errorText}`);
      }

      const manusData = await manusResponse.json();
      return { success: true, async: true, taskId: manusData.taskId, llmModelUsed: llmModel };
    }

    // Call LLM
    console.log("[analyze-module] Calling LLM with model:", llmModel);
    const llmResult = await callLLM(supabase, llmModel, systemPrompt, userPrompt);

    if (!llmResult.success) {
      console.error("[analyze-module] LLM error:", llmResult.error);
      await supabase.from('agent_results').upsert({
        hotel_id: hotelId, module_id: moduleId, status: 'error',
        result: llmResult.error || 'Erro ao chamar LLM',
      }, { onConflict: 'hotel_id,module_id' });
      return { error: llmResult.error };
    }

    // Save result
    const { error: saveError } = await supabase
      .from('agent_results')
      .upsert({
        hotel_id: hotelId, module_id: moduleId,
        result: llmResult.result,
        presentation_url: null,
        llm_model_used: llmModel,
        status: 'completed',
        generated_at: new Date().toISOString(),
      }, { onConflict: 'hotel_id,module_id' });

    if (saveError) throw new Error(`Failed to save result: ${saveError.message}`);

    console.log("[analyze-module] Analysis complete! Model used:", llmModel);
    return { success: true, result: llmResult.result, llmModelUsed: llmModel };

  } catch (error) {
    console.error("[analyze-module] Background processing error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    try {
      await supabase.from('agent_results').upsert({
        hotel_id: hotelId, module_id: moduleId,
        status: 'error', result: `Erro: ${errorMessage}`,
      }, { onConflict: 'hotel_id,module_id' });
    } catch (dbError) {
      console.error("[analyze-module] Failed to update error status:", dbError);
    }
    return { error: errorMessage };
  }
}
