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

  let requestBody: any = null;
  let reqHotelId: string | null = null;
  let reqModuleId: number | null = null;

  try {
    requestBody = await req.json();
    const { hotelId, moduleId, materials } = requestBody ?? {};
    reqHotelId = hotelId ?? null;
    reqModuleId = (moduleId ?? null) as number | null;
    
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

    // Update status to generating
    const { error: updateError } = await supabase
      .from('agent_results')
      .upsert({
        hotel_id: hotelId,
        module_id: moduleId,
        status: 'generating',
        result: null,
        presentation_url: null,
        generated_at: null,
      }, { onConflict: 'hotel_id,module_id' });

    if (updateError) {
      console.error("[analyze-module] Error updating status:", updateError);
    }

    // Get agent configuration for this module
    const { data: agentConfig, error: configError } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('module_id', moduleId)
      .maybeSingle();

    if (configError) throw new Error(`Failed to get agent config: ${configError.message}`);
    if (!agentConfig) throw new Error(`No agent configuration found for module ${moduleId}`);

    const configuredMaterials = agentConfig.materials_config || ['manual', 'dados', 'transcricao'];
    const secondaryMaterials = agentConfig.secondary_materials_config || [];
    console.log(`[analyze-module] Using agent config: ${agentConfig.module_title}, model: ${agentConfig.llm_model || 'google/gemini-2.5-flash'}, output_type: ${agentConfig.output_type || 'text'}, primary materials: ${configuredMaterials.join(', ')}, secondary materials: ${secondaryMaterials.length > 0 ? secondaryMaterials.join(', ') : 'none'}`);

    // Build context from materials (only include configured ones)
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

    // Fetch website data if configured
    if (configuredMaterials.includes('website')) {
      console.log("[analyze-module] Fetching website data for hotel:", hotelId);
      const { data: websiteData } = await supabase
        .from('hotel_website_data')
        .select('crawled_content, website_url')
        .eq('hotel_id', hotelId)
        .eq('status', 'completed')
        .maybeSingle();

      if (websiteData?.crawled_content && Array.isArray(websiteData.crawled_content)) {
        console.log(`[analyze-module] Found ${websiteData.crawled_content.length} crawled pages`);
        materialsContext += `\n\n## Conteúdo do Site do Hotel (${websiteData.website_url})`;
        for (const page of websiteData.crawled_content) {
          materialsContext += `\n\n### ${page.title || 'Página'}\nURL: ${page.url}`;
          if (page.description) materialsContext += `\nDescrição: ${page.description}`;
          if (page.text) materialsContext += `\nConteúdo:\n${page.text.substring(0, 3000)}`;
        }
      }
    }

    // Fetch consolidated reviews if configured
    if (configuredMaterials.includes('reviews')) {
      const { data: reviewsMaterial } = await supabase
        .from('hotel_materials')
        .select('text_content, file_name')
        .eq('hotel_id', hotelId)
        .eq('material_type', 'reviews')
        .maybeSingle();

      if (reviewsMaterial?.text_content) {
        materialsContext += `\n\n## Avaliações Consolidadas (Últimos 24 Meses)\n${reviewsMaterial.text_content}`;
      }
    }

    // Fetch competitor data if configured
    if (configuredMaterials.includes('competitors')) {
      const { data: competitorData } = await supabase
        .from('hotel_competitor_data')
        .select('competitor_url, competitor_number, generated_analysis, analysis_status, llm_model_used')
        .eq('hotel_id', hotelId)
        .eq('status', 'completed')
        .eq('analysis_status', 'completed')
        .order('competitor_number', { ascending: true });

      if (competitorData && competitorData.length > 0) {
        materialsContext += `\n\n## Análise dos Sites Concorrentes`;
        for (const competitor of competitorData) {
          materialsContext += `\n\n### Análise Concorrente ${competitor.competitor_number}: ${competitor.competitor_url}`;
          materialsContext += `\n(Gerado por: ${competitor.llm_model_used || 'LLM'})`;
          materialsContext += competitor.generated_analysis ? `\n\n${competitor.generated_analysis}` : `\n\nAnálise não disponível.`;
        }
      }
    }

    // Fetch secondary materials (results from other agents)
    if (secondaryMaterials.length > 0) {
      const { data: agentResults, error: resultsError } = await supabase
        .from('agent_results')
        .select('module_id, result')
        .eq('hotel_id', hotelId)
        .eq('status', 'completed')
        .in('module_id', secondaryMaterials);
      
      if (!resultsError && agentResults && agentResults.length > 0) {
        const { data: agentTitles } = await supabase
          .from('agent_configs')
          .select('module_id, module_title')
          .in('module_id', agentResults.map(r => r.module_id));
        
        const titleMap = new Map(agentTitles?.map(t => [t.module_id, t.module_title]) || []);
        materialsContext += `\n\n---\n\n# MATERIAIS SECUNDÁRIOS (Resultados de Outros Agentes)\n`;
        for (const agentResult of agentResults) {
          const title = titleMap.get(agentResult.module_id) || `Agente ${agentResult.module_id}`;
          materialsContext += `\n\n## ${title}\n${agentResult.result}`;
        }
      }
    }

    if (!materialsContext) {
      materialsContext = "Nenhum material foi anexado para análise. Por favor, forneça uma análise baseada em boas práticas do setor hoteleiro.";
    }

    const systemPrompt = agentConfig.prompt;
    const userPrompt = `Analise os seguintes materiais do hotel e gere o resultado conforme as instruções:

${materialsContext}

Por favor, forneça uma análise detalhada e profissional em português do Brasil.`;

    const llmModel = agentConfig.llm_model || 'google/gemini-2.5-flash';
    console.log(`[analyze-module] Using LLM model: ${llmModel}`);

    let generatedResult: string;

    // Check if it's a Manus model - route to manus-agent function
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
        body: JSON.stringify({
          hotelId,
          moduleId,
          prompt: systemPrompt + "\n\n" + userPrompt,
          materials: materialsContext
        }),
      });

      if (!manusResponse.ok) {
        const errorText = await manusResponse.text();
        console.error("[analyze-module] Manus agent error:", manusResponse.status, errorText);
        
        await supabase.from('agent_results').upsert({
          hotel_id: hotelId,
          module_id: moduleId,
          status: 'error',
          result: `Erro ao chamar Manus Agent: ${errorText.substring(0, 500)}`,
          generated_at: new Date().toISOString(),
        }, { onConflict: 'hotel_id,module_id' });
        
        throw new Error(`Manus agent error: ${errorText}`);
      }

      const manusData = await manusResponse.json();
      console.log("[analyze-module] Manus task created:", manusData);

      return new Response(JSON.stringify({ 
        success: true,
        async: true,
        taskId: manusData.taskId,
        message: "Análise sendo processada pelo Manus Agent. O resultado será atualizado automaticamente.",
        llmModelUsed: llmModel
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call LLM using direct API keys
    console.log("[analyze-module] Calling LLM with model:", llmModel);
    const llmResult = await callLLM(supabase, llmModel, systemPrompt, userPrompt);

    if (!llmResult.success) {
      console.error("[analyze-module] LLM error:", llmResult.error);
      
      await supabase.from('agent_results').upsert({
        hotel_id: hotelId,
        module_id: moduleId,
        status: 'error',
        result: llmResult.error || 'Erro ao chamar LLM',
      }, { onConflict: 'hotel_id,module_id' });
      
      return new Response(JSON.stringify({ error: llmResult.error }), {
        status: llmResult.status || 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    generatedResult = llmResult.result;

    console.log("[analyze-module] AI response received, processing output...");

    const outputType = agentConfig.output_type || 'text';
    console.log(`[analyze-module] Output type: ${outputType}. Presentation will be created separately if needed.`);

    // Save result to database
    const { error: saveError } = await supabase
      .from('agent_results')
      .upsert({
        hotel_id: hotelId,
        module_id: moduleId,
        result: generatedResult,
        presentation_url: null,
        llm_model_used: llmModel,
        status: 'completed',
        generated_at: new Date().toISOString(),
      }, { onConflict: 'hotel_id,module_id' });

    if (saveError) throw new Error(`Failed to save result: ${saveError.message}`);

    console.log("[analyze-module] Analysis complete! Model used:", llmModel);

    return new Response(JSON.stringify({ 
      success: true,
      result: generatedResult,
      llmModelUsed: llmModel,
      outputType: outputType 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[analyze-module] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    try {
      if (reqHotelId && reqModuleId !== null) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase.from('agent_results').upsert({
            hotel_id: reqHotelId,
            module_id: reqModuleId,
            status: 'error',
            result: `Erro: ${errorMessage}`,
          }, { onConflict: 'hotel_id,module_id' });
        }
      }
    } catch (dbError) {
      console.error("[analyze-module] Failed to update error status:", dbError);
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
