import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { hotelId } = await req.json();
    if (!hotelId) throw new Error("hotelId required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch hotel info
    const { data: hotel } = await supabase.from("hotels").select("name, city").eq("id", hotelId).single();

    // Fetch all completed agent results
    const { data: results } = await supabase
      .from("agent_results")
      .select("module_id, result, status")
      .eq("hotel_id", hotelId)
      .eq("status", "completed");

    // Fetch agent configs for titles
    const { data: configs } = await supabase.from("agent_configs").select("module_id, module_title").order("display_order");

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum resultado de agente encontrado" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context from all agent results
    const agentSummaries = results.map(r => {
      const config = configs?.find(c => c.module_id === r.module_id);
      const title = config?.module_title || `Agente ${r.module_id}`;
      const truncatedResult = (r.result || '').substring(0, 3000);
      return `## ${title}\n${truncatedResult}`;
    }).join("\n\n---\n\n");

    const prompt = `Você é um consultor estratégico de marketing digital para hotéis. 
Analise os seguintes relatórios dos agentes estratégicos do hotel "${hotel?.name}" (${hotel?.city}) e gere um RESUMO ESTRATÉGICO CONSOLIDADO.

O resumo deve:
1. Ter uma visão geral executiva
2. Destacar os pontos-chave de cada análise
3. Identificar oportunidades e ameaças principais
4. Listar recomendações prioritárias
5. Ser bem estruturado com headers e bullet points em Markdown

RELATÓRIOS DOS AGENTES:
${agentSummaries}

Gere o resumo em português do Brasil, de forma profissional e concisa.`;

    // Call AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um consultor estratégico especializado em marketing digital hoteleiro." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || "";

    // Try to create Gamma presentation
    let presentationUrl = null;
    try {
      const { data: gammaKey } = await supabase
        .from("api_keys")
        .select("api_key")
        .eq("key_type", "gamma")
        .eq("is_active", true)
        .maybeSingle();

      if (gammaKey?.api_key) {
        const { data: gammaSettings } = await supabase.from("gamma_settings").select("*").limit(1).single();
        
        const gammaResponse = await fetch("https://api.gamma.app/v1/generate", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${gammaKey.api_key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: summary.substring(0, 5000),
            title: `Resumo Estratégico - ${hotel?.name}`,
            format: gammaSettings?.format || "presentation",
            theme_id: gammaSettings?.theme_id || "Oasis",
            num_cards: gammaSettings?.num_cards || 10,
            text_language: "pt-br",
          }),
        });

        if (gammaResponse.ok) {
          const gammaData = await gammaResponse.json();
          presentationUrl = gammaData.url || gammaData.presentation_url || null;
        }
      }
    } catch (gammaErr) {
      console.error("Gamma error (non-fatal):", gammaErr);
    }

    return new Response(JSON.stringify({ summary, presentationUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
