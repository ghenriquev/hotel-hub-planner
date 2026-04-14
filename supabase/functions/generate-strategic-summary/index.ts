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

    // Upsert to ensure record exists
    await supabase
      .from("hotel_project_data")
      .upsert({ hotel_id: hotelId, phase2_status: 'generating', updated_at: new Date().toISOString() }, { onConflict: 'hotel_id' });

    const backgroundTask = (async () => {
      try {
        const [hotelRes, resultsRes, configsRes, competitorRes] = await Promise.all([
          supabase.from("hotels").select("name, city").eq("id", hotelId).single(),
          supabase.from("agent_results").select("module_id, result, status").eq("hotel_id", hotelId).eq("status", "completed"),
          supabase.from("agent_configs").select("module_id, module_title").order("display_order"),
          supabase.from("hotel_competitor_data").select("competitor_number, generated_analysis, analysis_status").eq("hotel_id", hotelId).eq("analysis_status", "completed"),
        ]);

        const hotel = hotelRes.data;
        const results = resultsRes.data;
        const configs = configsRes.data;
        const competitors = competitorRes.data;

        if (!results || results.length === 0) {
          await supabase.from("hotel_project_data")
            .update({ phase2_status: 'error', updated_at: new Date().toISOString() })
            .eq("hotel_id", hotelId);
          return;
        }

        const agentSummaries = results.map(r => {
          const config = configs?.find(c => c.module_id === r.module_id);
          const title = config?.module_title || `Agente ${r.module_id}`;
          const truncatedResult = (r.result || '').substring(0, 4000);
          return `## ${title}\n${truncatedResult}`;
        }).join("\n\n---\n\n");

        // Include competitor analysis data if available
        let competitorSection = '';
        if (competitors && competitors.length > 0) {
          const competitorAnalyses = competitors
            .filter(c => c.generated_analysis)
            .map(c => `### Concorrente ${c.competitor_number}\n${(c.generated_analysis || '').substring(0, 3000)}`)
            .join("\n\n");
          if (competitorAnalyses) {
            competitorSection = `\n\n---\n\n## Análises de Concorrentes (dados complementares)\n${competitorAnalyses}`;
          }
        }

        const hotelName = hotel?.name || "Hotel";
        const hotelCity = hotel?.city || "cidade";

        const prompt = `Você é um consultor estratégico de marketing digital especializado em hotelaria da Reprotel.
Gere um RESUMO ESTRATÉGICO consolidado para o hotel "${hotelName}" localizado em ${hotelCity}.

O resumo deve consolidar todos os resultados dos agentes estratégicos da Fase 2 (Estratégia) do projeto, apresentando:

1. **Visão Geral do Posicionamento** - Resumo do posicionamento competitivo do hotel
2. **Principais Descobertas** - Os insights mais importantes identificados pelos agentes
3. **Análise de Mercado** - Pontos-chave sobre o mercado e concorrência
4. **Perfil do Público-Alvo** - Personas e público ideal identificados
5. **Estratégia de Comunicação** - Diretrizes de conteúdo e comunicação recomendadas
6. **Plano de Ação** - Principais ações táticas recomendadas
7. **Próximos Passos** - Encerre com uma seção explicando que nas próximas semanas o ${hotelName} receberá todas as entregas técnicas e vídeos explicativos das Fases 3 (Construção) e 4 (Ativação), incluindo artes, anúncios, landing page, CRM, SEO, analytics e tracking. Ao final, na Fase 5, será apresentado o Relatório Final consolidando todo o projeto de 60 dias de Transformação Digital.

DADOS DOS AGENTES ESTRATÉGICOS:
${agentSummaries}${competitorSection}

REGRAS:
- Use SEMPRE o nome "${hotelName}" e a cidade "${hotelCity}"
- Consolide as informações de forma executiva e profissional
- Use markdown com headers ##, listas com bullets
- Seja objetivo e direto — este é um resumo executivo
- NÃO invente dados — use apenas o que está nos relatórios dos agentes
- Gere em português do Brasil`;

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
              { role: "system", content: "Você é um consultor estratégico da Reprotel, especializado em marketing digital hoteleiro. Gere resumos executivos consolidados e profissionais." },
              { role: "user", content: prompt }
            ],
          }),
        });

        if (!aiResponse.ok) {
          console.error("AI error:", aiResponse.status, await aiResponse.text());
          await supabase.from("hotel_project_data")
            .update({ phase2_status: 'error', updated_at: new Date().toISOString() })
            .eq("hotel_id", hotelId);
          return;
        }

        const aiData = await aiResponse.json();
        const summary = aiData.choices?.[0]?.message?.content || "";

        await supabase.from("hotel_project_data")
          .update({
            phase2_summary: summary,
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

    // deno-lint-ignore no-explicit-any
    const runtime = (globalThis as any).EdgeRuntime;
    if (runtime?.waitUntil) {
      runtime.waitUntil(backgroundTask);
    } else {
      await backgroundTask;
    }

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
