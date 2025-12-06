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

    console.log(`[analyze-module] Using agent config: ${agentConfig.module_title}`);

    // Build context from materials
    let materialsContext = "";
    if (materials) {
      if (materials.manualFuncionamentoUrl) {
        materialsContext += `\n\n## Manual de Funcionamento\nURL: ${materials.manualFuncionamentoUrl}\nNome: ${materials.manualFuncionamentoName || 'Não especificado'}`;
      }
      if (materials.dadosHotelUrl) {
        materialsContext += `\n\n## Dados do Hotel\nURL: ${materials.dadosHotelUrl}\nNome: ${materials.dadosHotelName || 'Não especificado'}`;
      }
      if (materials.transcricaoKickoffUrl) {
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

    console.log("[analyze-module] Calling Lovable AI...");

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[analyze-module] AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        // Update status to error
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
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const generatedResult = aiData.choices?.[0]?.message?.content || "";

    console.log("[analyze-module] AI response received, saving result...");

    // Save result to database
    const { error: saveError } = await supabase
      .from('agent_results')
      .upsert({
        hotel_id: hotelId,
        module_id: moduleId,
        result: generatedResult,
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
      outputType: agentConfig.output_type 
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
