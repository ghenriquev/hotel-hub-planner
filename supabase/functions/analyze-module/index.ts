import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    
    if (data.status === "completed" && data.presentationUrl) {
      return data.presentationUrl;
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelId, moduleId, materials } = await req.json();
    
    console.log(`[analyze-module] Starting analysis for hotel: ${hotelId}, module: ${moduleId}`);
    
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
    console.log(`[analyze-module] Using agent config: ${agentConfig.module_title}, model: ${agentConfig.llm_model || 'lovable/gemini-2.5-flash'}, output_type: ${agentConfig.output_type || 'text'}, materials: ${configuredMaterials.join(', ')}`);

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

    // Check if output type is presentation - if so, generate via Gamma API
    let presentationUrl: string | null = null;
    const outputType = agentConfig.output_type || 'text';
    
    if (outputType === 'presentation') {
      console.log("[analyze-module] Output type is presentation, fetching Gamma API key...");
      
      // Fetch Gamma API key from api_keys table
      const { data: gammaKeyData, error: gammaKeyError } = await supabase
        .from('api_keys')
        .select('api_key')
        .or('name.ilike.%gamma%,key_type.ilike.%gamma%')
        .eq('is_active', true)
        .maybeSingle();
      
      if (gammaKeyError || !gammaKeyData?.api_key) {
        console.error("[analyze-module] No active Gamma API key found:", gammaKeyError);
        // Continue without presentation - save text result
      } else {
        console.log("[analyze-module] Creating Gamma presentation...");
        
        try {
          const gammaResponse = await fetch("https://public-api.gamma.app/v1.0/generations", {
            method: "POST",
            headers: {
              "X-API-KEY": gammaKeyData.api_key,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputText: generatedResult,
              format: "presentation",
              textMode: "generate",
              numCards: 10,
              textOptions: {
                tone: "professional",
                audience: "hotel management professionals",
                language: "pt-BR"
              }
            }),
          });
          
          if (!gammaResponse.ok) {
            const errorText = await gammaResponse.text();
            console.error("[analyze-module] Gamma API error:", gammaResponse.status, errorText);
          } else {
            const gammaData = await gammaResponse.json();
            console.log("[analyze-module] Gamma generation started:", gammaData);
            
            if (gammaData.generationId) {
              // Poll for completion
              presentationUrl = await pollGammaGeneration(gammaData.generationId, gammaKeyData.api_key);
              
              if (presentationUrl) {
                console.log("[analyze-module] Gamma presentation ready:", presentationUrl);
              } else {
                console.error("[analyze-module] Failed to get Gamma presentation URL");
              }
            }
          }
        } catch (gammaError) {
          console.error("[analyze-module] Gamma API call failed:", gammaError);
        }
      }
    }

    // Save result to database
    const { error: saveError } = await supabase
      .from('agent_results')
      .upsert({
        hotel_id: hotelId,
        module_id: moduleId,
        result: generatedResult,
        presentation_url: presentationUrl,
        status: 'completed',
        generated_at: new Date().toISOString(),
      }, { onConflict: 'hotel_id,module_id' });

    if (saveError) {
      throw new Error(`Failed to save result: ${saveError.message}`);
    }

    console.log("[analyze-module] Analysis complete!");

    return new Response(JSON.stringify({ 
      success: true,
      result: generatedResult,
      presentationUrl: presentationUrl,
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