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

    // Fetch agent configs
    const { data: configs } = await supabase.from("agent_configs").select("module_id, module_title").order("display_order");

    // Fetch phase 3/4 deliverables
    const { data: projectData } = await supabase
      .from("hotel_project_data")
      .select("phase34_deliverables")
      .eq("hotel_id", hotelId)
      .maybeSingle();

    const agentSummaries = (results || []).map(r => {
      const config = configs?.find(c => c.module_id === r.module_id);
      const title = config?.module_title || `Agente ${r.module_id}`;
      return `## ${title}\n${(r.result || '').substring(0, 2000)}`;
    }).join("\n\n---\n\n");

    const deliverables = projectData?.phase34_deliverables 
      ? JSON.stringify(projectData.phase34_deliverables, null, 2) 
      : "Nenhuma entrega registrada";

    const prompt = `Você é um consultor estratégico de marketing digital para hotéis.
Gere um RELATÓRIO FINAL PROFISSIONAL para o hotel "${hotel?.name}" (${hotel?.city}).

O relatório deve seguir esta estrutura:

# Plano Estratégico de Vendas Diretas
## Relatório de Entregas – 60 Dias de Transformação Digital

### 1. Visão Geral do Projeto (Resumo Executivo)
Um parágrafo conciso resumindo o que foi construído, entregue e ativado durante o projeto.

### 2. O Que Foi o Projeto de 60 Dias
Apresente os cinco pilares: Estratégia, Tráfego, Conversão, Relacionamento, Mensuração.

### 3. A Base Estratégica Construída
Consolide os principais pontos dos agentes estratégicos e das entregas das fases 3 e 4.

### 4. Proposta de Continuidade: Próximos Passos
**A Fundação Está Pronta. Agora é Hora de Escalar.**
- O que acontece se continuarmos juntos?
- O potencial é real
- Chamada para ação: "Vamos escalar juntos?"

DADOS DOS AGENTES ESTRATÉGICOS:
${agentSummaries || "Sem dados de agentes"}

ENTREGAS FASES 3 E 4:
${deliverables}

Gere em português do Brasil, profissional, com Markdown bem estruturado.`;

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
          { role: "system", content: "Você é um consultor estratégico especializado em marketing digital hoteleiro. Crie relatórios profissionais e impactantes." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const report = aiData.choices?.[0]?.message?.content || "";

    // Try Gamma presentation
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
            text: report.substring(0, 5000),
            title: `Relatório Final - ${hotel?.name} - 60 Dias de Transformação Digital`,
            format: gammaSettings?.format || "presentation",
            theme_id: gammaSettings?.theme_id || "Oasis",
            num_cards: gammaSettings?.num_cards || 12,
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

    return new Response(JSON.stringify({ report, presentationUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
