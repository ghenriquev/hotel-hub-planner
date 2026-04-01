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

        // Fetch phase34 deliverables
        const { data: projectDataRow } = await supabase
          .from("hotel_project_data")
          .select("phase34_deliverables")
          .eq("hotel_id", hotelId)
          .maybeSingle();

        // Build context from all agent results
        const agentSummaries = results.map(r => {
          const config = configs?.find(c => c.module_id === r.module_id);
          const title = config?.module_title || `Agente ${r.module_id}`;
          const truncatedResult = (r.result || '').substring(0, 4000);
          return `## ${title}\n${truncatedResult}`;
        }).join("\n\n---\n\n");

        const deliverablesJson = projectDataRow?.phase34_deliverables ? JSON.stringify(projectDataRow.phase34_deliverables) : "Nenhuma entrega registrada ainda.";

        const prompt = `Você é um consultor estratégico de marketing digital especializado em hotelaria.
Gere um RELATÓRIO DE ENTREGAS completo para o hotel "${hotel?.name}" (${hotel?.city}).

Este relatório será enviado para o Gamma para gerar uma apresentação profissional. O texto deve ser rico, bem estruturado e seguir EXATAMENTE esta estrutura de seções:

---

# Plano Estratégico de Vendas Diretas — Relatório de Entregas
## ${hotel?.name} — 60 Dias de Transformação Digital

Tudo o que foi construído, entregue e ativado para o ${hotel?.name} durante o projeto intensivo. Uma base sólida para escalar as reservas diretas com inteligência, estratégia e resultado.

---

## VISÃO GERAL — O Que Foi o Projeto de 60 Dias
Descreva de forma executiva os cinco pilares do projeto: Estratégia, Tráfego, Conversão, Relacionamento e Mensuração. Explique brevemente cada pilar e o que foi entregue.

## ANÁLISE & ESTRATÉGIA — A Base Estratégica Construída
Liste todas as entregas da fase de análise (com base nos resultados dos agentes): análise de mercado, posicionamento competitivo, cliente oculto, personas, SWOT digital, etc.

## TÁTICO — Criativos & Canais
Descreva as entregas de comunicação: artes e copys dos anúncios, e-mail marketing, landing page. Explique o que foi criado e para que serve.

## CRM & RELACIONAMENTO — Gestão de Relacionamento com o Hóspede
Descreva a infraestrutura de CRM implementada, roteiros de WhatsApp, scripts de pós-venda, conta CRM.

## TRÁFEGO PAGO — Meta Ads
Explique a estratégia de funil no Meta Ads (Topo, Meio, Fundo) e os públicos de remarketing configurados. Detalhe cada nível.

## TRÁFEGO PAGO — Google Ads
Explique a estrutura em 3 níveis de prioridade (Rede de Pesquisa, Concorrentes + Hotel Ads, PMAX) e os públicos de remarketing no Google Ads.

## MENSURAÇÃO & RASTREAMENTO — Infraestrutura de Dados Configurada
Descreva as ferramentas implementadas: Google Tag Manager, Google Analytics, Conversão Google Ads, Pixel do Facebook. Explique a importância de cada uma.

## PRÓXIMOS PASSOS — A Fundação Está Pronta. Agora é Hora de Escalar.
Conclua com uma visão de continuidade: o que foi construído, o potencial de crescimento e os benefícios de continuar o serviço mensal.

---

IMPORTANTE:
- Use o nome "${hotel?.name}" e a cidade "${hotel?.city}" — NUNCA use nomes de outros hotéis
- Adapte o conteúdo com base nos dados reais dos agentes e entregas abaixo
- O texto deve ser profissional, persuasivo e detalhado
- Use markdown com headers ##, listas e tabelas quando apropriado
- Cada seção deve ter conteúdo substancial (não apenas tópicos vagos)

RELATÓRIOS DOS AGENTES:
${agentSummaries}

ENTREGAS FASES 3 & 4:
${deliverablesJson}

Gere o relatório completo em português do Brasil.`;

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
              { role: "system", content: "Você é um consultor estratégico especializado em marketing digital hoteleiro. Gere relatórios de entregas profissionais e detalhados que serão transformados em apresentações executivas." },
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
                title: `Plano Estratégico de Vendas Diretas - Relatório de Entregas - ${hotel?.name}`,
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
