import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelId, messages } = await req.json();

    if (!hotelId || !messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'hotelId and messages are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client for fetching data
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all agent results with their configs (dynamically)
    const { data: agentResults, error: resultsError } = await supabase
      .from('agent_results')
      .select('module_id, result, status, llm_model_used')
      .eq('hotel_id', hotelId)
      .eq('status', 'completed');

    if (resultsError) {
      console.error('Error fetching agent results:', resultsError);
    }

    // Fetch agent configs for titles
    const { data: agentConfigs, error: configsError } = await supabase
      .from('agent_configs')
      .select('module_id, module_title');

    if (configsError) {
      console.error('Error fetching agent configs:', configsError);
    }

    // Create a map of module_id to title
    const configMap = new Map(
      (agentConfigs || []).map(c => [c.module_id, c.module_title])
    );

    // Fetch website data
    const { data: websiteData, error: websiteError } = await supabase
      .from('hotel_website_data')
      .select('crawled_content, status')
      .eq('hotel_id', hotelId)
      .eq('status', 'completed')
      .maybeSingle();

    if (websiteError) {
      console.error('Error fetching website data:', websiteError);
    }

    // Build dynamic context
    let contextParts: string[] = [];

    // Add primary materials context info
    contextParts.push(`## MATERIAIS PRIMÁRIOS DISPONÍVEIS

Os materiais primários (Manual de Funcionamento, Briefing de Criação, Transcrição de Kickoff) são arquivos que foram enviados para o sistema. Eles foram processados pelos agentes estratégicos e os resultados estão disponíveis abaixo.`);

    // Add website content if available
    if (websiteData?.crawled_content && Array.isArray(websiteData.crawled_content)) {
      contextParts.push(`\n### Conteúdo do Site (${websiteData.crawled_content.length} páginas extraídas)`);
      websiteData.crawled_content.slice(0, 5).forEach((page: any, index: number) => {
        if (page.text) {
          const truncatedText = page.text.substring(0, 2000);
          contextParts.push(`\n#### Página ${index + 1}: ${page.url || 'N/A'}\n${truncatedText}`);
        }
      });
    }

    // Add agent results dynamically
    if (agentResults && agentResults.length > 0) {
      contextParts.push(`\n## ANÁLISES ESTRATÉGICAS (${agentResults.length} agentes concluídos)\n`);
      
      agentResults.forEach((result) => {
        const title = configMap.get(result.module_id) || `Agente ${result.module_id}`;
        contextParts.push(`### ${title}\n${result.result || 'Sem resultado disponível'}\n`);
      });
    } else {
      contextParts.push(`\n## ANÁLISES ESTRATÉGICAS\nNenhum agente foi executado ainda para este hotel.`);
    }

    const systemPrompt = `Você é o HotelGPT, um assistente especializado em consultoria hoteleira da Reprotel Marketing Hoteleiro.

Você tem acesso a todos os dados e análises estratégicas deste hotel. Responda às perguntas do consultor de forma precisa, objetiva e profissional.

REGRAS IMPORTANTES:
1. Sempre cite a fonte da informação (qual agente ou material)
2. Se não encontrar a informação nos dados disponíveis, diga claramente
3. Seja conciso mas completo
4. Use formatação markdown quando apropriado
5. Foque em insights acionáveis para o consultor

${contextParts.join('\n')}

---
Responda em português brasileiro de forma profissional e consultiva.`;

    console.log('Sending request to Lovable AI with context length:', systemPrompt.length);

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua mensagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("hotel-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
