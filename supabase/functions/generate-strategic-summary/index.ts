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

    // Set status to generating
    await supabase
      .from("hotel_project_data")
      .update({ phase2_status: 'generating', updated_at: new Date().toISOString() })
      .eq("hotel_id", hotelId);

    // Background processing - return immediately
    const backgroundTask = (async () => {
      try {
        // Fetch hotel info and agent results in parallel
        const [hotelRes, resultsRes, configsRes] = await Promise.all([
          supabase.from("hotels").select("name, city").eq("id", hotelId).single(),
          supabase.from("agent_results").select("module_id, result, status").eq("hotel_id", hotelId).eq("status", "completed"),
          supabase.from("agent_configs").select("module_id, module_title").order("display_order"),
        ]);

        const hotel = hotelRes.data;
        const results = resultsRes.data;
        const configs = configsRes.data;

        if (!results || results.length === 0) {
          await supabase.from("hotel_project_data")
            .update({ phase2_status: 'error', updated_at: new Date().toISOString() })
            .eq("hotel_id", hotelId);
          return;
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
          await supabase.from("hotel_project_data")
            .update({ phase2_status: 'error', updated_at: new Date().toISOString() })
            .eq("hotel_id", hotelId);
          return;
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

        // Save results
        await supabase.from("hotel_project_data")
          .update({
            phase2_summary: summary,
            phase2_presentation_url: presentationUrl,
            phase2_status: 'completed',
            phase2_generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("hotel_id", hotelId);

        console.log("Strategic summary generated successfully for hotel:", hotelId);
      } catch (err) {
        console.error("Background processing error:", err);
        await supabase.from("hotel_project_data")
          .update({ phase2_status: 'error', updated_at: new Date().toISOString() })
          .eq("hotel_id", hotelId);
      }
    })();

    // Use waitUntil to keep the function alive for background processing
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(backgroundTask);
    } else {
      // Fallback: await if EdgeRuntime not available
      await backgroundTask;
    }

    // Return immediately
    return new Response(JSON.stringify({ async: true, status: "generating" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
