// VERSION: 3.0.0 - Two-phase execution: text first, presentation separate - saves llm_model_used
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Version identifier for debugging deployments
const FUNCTION_VERSION = "3.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to poll Gamma API for generation status
async function pollGammaGeneration(generationId: string, apiKey: string, maxAttempts = 60): Promise<string | null> {
  console.log(`[analyze-module] Polling Gamma generation ${generationId}...`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between polls
    
    const response = await fetch(`https://public-api.gamma.app/v1.0/generations/${generationId}`, {
      headers: {
        "X-API-KEY": apiKey,
      },
    });
    
    if (!response.ok) {
      console.error(`[analyze-module] Gamma poll error: ${response.status}`);
      continue;
    }
    
    const data = await response.json();
    console.log(`[analyze-module] Gamma status: ${data.status}, attempt ${attempt + 1}/${maxAttempts}`);
    
    if (data.status === "completed") {
      console.log(`[analyze-module] Gamma completed response:`, JSON.stringify(data));
      // Gamma API returns gammaUrl, not presentationUrl
      if (data.gammaUrl) {
        console.log(`[analyze-module] Got gammaUrl: ${data.gammaUrl}`);
        return data.gammaUrl;
      }
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
  // Log version immediately to confirm deployment
  console.log(`[analyze-module] ===== FUNCTION VERSION ${FUNCTION_VERSION} =====`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelId, moduleId, materials } = await req.json();
    
    console.log(`[analyze-module] v${FUNCTION_VERSION} - Starting analysis for hotel: ${hotelId}, module: ${moduleId}`);
    
    if (!hotelId || moduleId === undefined) {
      throw new Error("hotelId and moduleId are required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
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

    if (configError) {
      throw new Error(`Failed to get agent config: ${configError.message}`);
    }

    if (!agentConfig) {
      throw new Error(`No agent configuration found for module ${moduleId}`);
    }

    // Get configured materials for this agent (default to all if not configured)
    const configuredMaterials = agentConfig.materials_config || ['manual', 'dados', 'transcricao'];
    const secondaryMaterials = agentConfig.secondary_materials_config || [];
    console.log(`[analyze-module] Using agent config: ${agentConfig.module_title}, model: ${agentConfig.llm_model || 'lovable/gemini-2.5-flash'}, output_type: ${agentConfig.output_type || 'text'}, primary materials: ${configuredMaterials.join(', ')}, secondary materials: ${secondaryMaterials.length > 0 ? secondaryMaterials.join(', ') : 'none'}`);

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

    // Fetch website data if configured to use it
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
          if (page.description) {
            materialsContext += `\nDescrição: ${page.description}`;
          }
          if (page.text) {
            materialsContext += `\nConteúdo:\n${page.text.substring(0, 3000)}`;
          }
        }
      } else {
        console.log("[analyze-module] No website data available for this hotel");
      }
    }

    // Fetch consolidated reviews if configured to use it
    if (configuredMaterials.includes('reviews')) {
      console.log("[analyze-module] Fetching consolidated reviews for hotel:", hotelId);
      const { data: reviewsMaterial } = await supabase
        .from('hotel_materials')
        .select('text_content, file_name')
        .eq('hotel_id', hotelId)
        .eq('material_type', 'reviews')
        .maybeSingle();

      if (reviewsMaterial?.text_content) {
        console.log(`[analyze-module] Found consolidated reviews document: ${reviewsMaterial.file_name}`);
        materialsContext += `\n\n## Avaliações Consolidadas (Últimos 24 Meses)\n${reviewsMaterial.text_content}`;
      } else {
        console.log("[analyze-module] No consolidated reviews available for this hotel");
      }
    }

    // Fetch secondary materials (results from other agents)
    if (secondaryMaterials.length > 0) {
      console.log(`[analyze-module] Fetching secondary materials from agents: ${secondaryMaterials.join(', ')}`);
      
      const { data: agentResults, error: resultsError } = await supabase
        .from('agent_results')
        .select('module_id, result')
        .eq('hotel_id', hotelId)
        .eq('status', 'completed')
        .in('module_id', secondaryMaterials);
      
      if (resultsError) {
        console.error("[analyze-module] Error fetching secondary materials:", resultsError);
      } else if (agentResults && agentResults.length > 0) {
        console.log(`[analyze-module] Found ${agentResults.length} secondary materials`);
        
        // Get agent titles for better context
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
      } else {
        console.log("[analyze-module] No completed secondary materials found");
      }
    }

    if (!materialsContext) {
      materialsContext = "Nenhum material foi anexado para análise. Por favor, forneça uma análise baseada em boas práticas do setor hoteleiro.";
    }

    const systemPrompt = agentConfig.prompt;
    const userPrompt = `Analise os seguintes materiais do hotel e gere o resultado conforme as instruções:

${materialsContext}

Por favor, forneça uma análise detalhada e profissional em português do Brasil.`;

    // Determine which model to use
    const llmModel = agentConfig.llm_model || 'google/gemini-2.5-flash';
    console.log(`[analyze-module] Using LLM model: ${llmModel}`);

    let generatedResult: string;

    // Check if it's a Manus model - route to manus-agent function
    if (llmModel.startsWith('manus/')) {
      console.log("[analyze-module] Routing to Manus Agent...");
      
      // Call manus-agent function with full context
      const manusResponse = await fetch(`${SUPABASE_URL}/functions/v1/manus-agent`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
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
        throw new Error(`Manus agent error: ${errorText}`);
      }

      const manusData = await manusResponse.json();
      console.log("[analyze-module] Manus task created:", manusData);

      // Manus is async - return immediately with task ID
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

    // Check if it's a Lovable AI model (lovable/, google/, or openai/ prefixes are all supported)
    const isLovableAIModel = llmModel.startsWith('lovable/') || 
                              llmModel.startsWith('google/') || 
                              llmModel.startsWith('openai/');
    
    if (isLovableAIModel) {
      // Use Lovable AI Gateway - pass the full model name with prefix
      console.log("[analyze-module] Calling Lovable AI with model:", llmModel);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: llmModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[analyze-module] Lovable AI error:", response.status, errorText);
        
        if (response.status === 429) {
          await supabase.from('agent_results').upsert({
            hotel_id: hotelId,
            module_id: moduleId,
            status: 'error',
            result: 'Limite de requisições excedido. Tente novamente em alguns minutos.',
          }, { onConflict: 'hotel_id,module_id' });
          
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        if (response.status === 402) {
          await supabase.from('agent_results').upsert({
            hotel_id: hotelId,
            module_id: moduleId,
            status: 'error',
            result: 'Créditos insuficientes. Adicione créditos na sua conta.',
          }, { onConflict: 'hotel_id,module_id' });
          
          return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        throw new Error(`Lovable AI gateway error: ${response.status}`);
      }

      const aiData = await response.json();
      generatedResult = aiData.choices?.[0]?.message?.content || "";
    } else if (llmModel.startsWith('anthropic/')) {
      // Use Anthropic/Claude directly with API key from database
      const { data: apiKeyData, error: keyError } = await supabase
        .from('api_keys')
        .select('api_key')
        .eq('key_type', 'anthropic')
        .eq('is_active', true)
        .maybeSingle();

      if (keyError || !apiKeyData) {
        throw new Error("No active Anthropic API key found");
      }

      const modelName = llmModel.replace('anthropic/', '');
      console.log("[analyze-module] Calling Anthropic with model:", modelName);

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
          system: systemPrompt,
          messages: [
            { role: "user", content: userPrompt }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[analyze-module] Anthropic error:", response.status, errorText);
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const aiData = await response.json();
      generatedResult = aiData.content?.[0]?.text || "";
    } else {
      throw new Error(`Unsupported LLM model: ${llmModel}`);
    }

    console.log("[analyze-module] AI response received, processing output...");

    // Get output type for response info
    const outputType = agentConfig.output_type || 'text';
    
    // NOTE: We no longer auto-generate Gamma presentations here.
    // Users edit the text first, then click "Criar Apresentação" which calls create-presentation function.
    console.log(`[analyze-module] Output type: ${outputType}. Presentation will be created separately if needed.`);

    // Save result to database (no presentation_url - that's created separately now)
    const { error: saveError } = await supabase
      .from('agent_results')
      .upsert({
        hotel_id: hotelId,
        module_id: moduleId,
        result: generatedResult,
        presentation_url: null, // Will be set by create-presentation function
        llm_model_used: llmModel, // Save which model was used
        status: 'completed',
        generated_at: new Date().toISOString(),
      }, { onConflict: 'hotel_id,module_id' });

    if (saveError) {
      throw new Error(`Failed to save result: ${saveError.message}`);
    }

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
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
