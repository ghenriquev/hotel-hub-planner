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

        const hotelName = hotel?.name || "Hotel";
        const hotelCity = hotel?.city || "cidade";

        const prompt = `Você é um consultor estratégico de marketing digital especializado em hotelaria da Reprotel.
Gere um RELATÓRIO DE ENTREGAS profissional e completo para o hotel "${hotelName}" localizado em ${hotelCity}.

Este relatório será enviado para o Gamma para gerar uma apresentação executiva de alta qualidade. O texto deve seguir EXATAMENTE a estrutura abaixo, com 8 seções (cards/slides). Cada seção deve ter conteúdo substancial, profissional e persuasivo.

ESTRUTURA OBRIGATÓRIA (8 seções):

---

# Plano Estratégico de Vendas Diretas
## Relatório de Entregas – 60 Dias de Transformação Digital

Tudo o que foi construído, entregue e ativado para o ${hotelName} durante o projeto intensivo. Uma base sólida para escalar as reservas diretas com inteligência, estratégia e resultado.

---

## VISÃO GERAL — O Que Foi o Projeto de 60 Dias

O Plano Estratégico de Vendas Diretas é um projeto intensivo que une cinco pilares fundamentais para transformar a presença digital do ${hotelName} e aumentar suas reservas diretas de forma sustentável.

Apresente os 5 pilares em formato de grid visual:
- **Estratégia:** Análise do mercado, do cliente oculto e do posicionamento competitivo.
- **Tráfego:** Campanhas no Google Ads e Meta Ads para atrair visitantes qualificados.
- **Conversão:** Landing page, site novo e criativos otimizados para gerar reservas.
- **Relacionamento:** CRM, roteiros de WhatsApp e scripts de pós-venda para fidelizar clientes.
- **Mensuração:** Tag Manager, Analytics, Pixel e rastreamento de conversões configurados.

---

## ANÁLISE & ESTRATÉGIA — A Base Estratégica Construída

### Entregas da Fase de Análise

Com base nos resultados reais dos agentes, liste as entregas estratégicas realizadas. Inclua itens como:
- Análise de mercado e posicionamento competitivo
- Cliente oculto para avaliação da experiência de atendimento
- Mapeamento da jornada de compra do hóspede
- Definição de personas e público-alvo ideal
- Estratégia de conteúdo e comunicação alinhada à marca
- Plano de ação tático para os 60 dias

Adapte e enriqueça com base nos dados reais dos agentes fornecidos abaixo.

---

## TÁTICO — Artes, E-mail e Landing Page

Desenvolvemos todos os materiais de comunicação com identidade visual consistente e mensagens estratégicas para cada canal e etapa da jornada do cliente.

1. **Artes & Copys dos Anúncios:** Criativos personalizados para Meta Ads e Google Ads, com copies otimizados para cada nível do funil.
2. **E-mail Marketing:** Sequências de e-mail desenhadas para nutrir leads, recuperar abandono de reserva e fidelizar hóspedes anteriores.
3. **Landing Page Ativa:** Página de captura e conversão já no ar, focada em transformar visitantes em reservas diretas de forma rápida e clara.

Adapte com base nas entregas reais registradas.

---

## CRM & RELACIONAMENTO — Gestão de Relacionamento com o Hóspede

Construímos toda a infraestrutura de CRM para que o ${hotelName} possa se comunicar de forma profissional, ágil e personalizada com seus clientes em cada etapa — antes, durante e após a reserva.

- **Conta Reprotel CRM:** Plataforma centralizada para gestão de leads, histórico de contatos e acompanhamento.
- **Cliente Oculto:** Avaliação detalhada da experiência de atendimento para identificar pontos de melhoria.
- **Roteiro de WhatsApp:** Scripts estruturados para conduzir conversas no WhatsApp com naturalidade e eficiência.
- **Script de Pós-Venda:** Protocolo de comunicação após a estadia para coletar avaliações e fidelizar o hóspede.

---

## TRÁFEGO PAGO — Meta Ads e Google Ads

### Estratégia de Funil no Meta Ads
- **Topo de Funil:** Públicos frios — interesses em viagens, turismo, destinos. Objetivo: alcance e reconhecimento de marca.
- **Meio de Funil:** Visitantes do site, engajamento no Instagram, visualizações de vídeo. Objetivo: consideração e interação.
- **Fundo de Funil:** Visitantes da landing page, iniciaram reserva, lista de hóspedes anteriores. Objetivo: conversão direta.

### Públicos de Remarketing do Meta Ads
Detalhe os públicos configurados: visitantes do site, engajamento social, lookalike de hóspedes.

### Estrutura Estratégica no Google Ads
- **Prioridade 1 — Rede de Pesquisa:** Palavras-chave de alta intenção (ex: "pousada em ${hotelCity}", "hotel em ${hotelCity} com piscina").
- **Prioridade 2 — Concorrentes + Hotel Ads:** Aparecer quando buscam concorrentes e no Google Hotel Ads.
- **Prioridade 3 — PMAX:** Campanhas de Performance Max para maximizar cobertura e conversões.

### Públicos de Remarketing no Google Ads
Detalhe os públicos: visitantes do site, lista de clientes, abandono de reserva.

---

## MENSURAÇÃO & RASTREAMENTO — Infraestrutura de Dados Configurada

Para que toda a estratégia funcione com precisão e possamos medir resultados reais, implementamos quatro ferramentas essenciais de rastreamento e análise. Sem dados, não há otimização — com eles, cada decisão é baseada em evidências.

- **Google Tag Manager:** Central de gerenciamento de tags e eventos do site. Permite instalar, editar e monitorar scripts sem depender de desenvolvedor.
- **Google Analytics:** Monitora o comportamento dos visitantes no site: de onde vieram, o que acessaram, quanto tempo ficaram e se converteram em reserva.
- **Conversão Google Ads:** Rastreia cada reserva gerada pelos anúncios do Google, mensura o valor gerado e calcula o retorno sobre o investimento (ROAS) das campanhas.
- **Pixel do Facebook:** Registra ações vindas do Instagram e Facebook: conversas, compras e visitantes do site. Alimenta o remarketing e cria públicos semelhantes aos que já converteram.

---

## PRÓXIMOS PASSOS — A Fundação Está Pronta. Agora é Hora de Escalar.

Nos últimos 60 dias, construímos juntos toda a infraestrutura necessária para que o ${hotelName} cresça de forma sustentável e inteligente no digital.

**O que acontece se continuarmos juntos?**
Com o serviço mensal, damos continuidade a tudo que foi criado: otimizamos campanhas com base nos dados reais, escalamos o que funciona, corrigimos o que pode melhorar e avançamos para novas etapas da estratégia.

**O potencial do ${hotelName} é real.**
${hotelCity} é um dos destinos turísticos mais procurados. Com a estrutura que montamos, o ${hotelName} tem todas as condições de se tornar um caso de sucesso memorável em reservas diretas.

**Vamos escalar juntos?**
A base está sólida, os dados estão fluindo e as campanhas estão no ar. O próximo passo é continuar — e colher os frutos de tudo que construímos. Conte com a Reprotel para isso.

---

REGRAS IMPORTANTES:
- Use SEMPRE o nome "${hotelName}" e a cidade "${hotelCity}" — NUNCA use nomes de outros hotéis como "Cafundó" ou qualquer outro
- Adapte o conteúdo com base nos dados REAIS dos agentes e entregas fornecidos abaixo
- O texto deve ser profissional, persuasivo e executivo
- Use markdown com headers ##, listas com bullets e numeração
- Cada seção deve ser rica em conteúdo — nunca vaga ou genérica
- NÃO invente dados que não existam nos relatórios — adapte o modelo com as informações reais disponíveis

RELATÓRIOS DOS AGENTES ESTRATÉGICOS:
${agentSummaries}

ENTREGAS REGISTRADAS NAS FASES 3 & 4:
${deliverablesJson}

Gere o relatório completo em português do Brasil, seguindo fielmente a estrutura acima.`;

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
              { role: "system", content: "Você é um consultor estratégico da Reprotel, especializado em marketing digital hoteleiro. Gere relatórios de entregas profissionais e detalhados que serão transformados em apresentações executivas para clientes. O tom deve ser de profissionalismo, expertise e visão de futuro." },
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

        // Save results (no automatic Gamma - user triggers presentation separately)
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

    // Use waitUntil to keep the function alive for background processing
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(backgroundTask);
    } else {
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
