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
    const { hotelId, messages, contextMode = 'all' } = await req.json();

    if (!hotelId || !messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'hotelId and messages are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Hotel chat request with contextMode:', contextMode);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client for fetching data
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch hotel data
    const { data: hotelData, error: hotelError } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', hotelId)
      .maybeSingle();

    if (hotelError) {
      console.error('Error fetching hotel:', hotelError);
    }

    // Fetch primary materials from hotel_materials table
    const { data: hotelMaterials, error: materialsError } = await supabase
      .from('hotel_materials')
      .select('*')
      .eq('hotel_id', hotelId);

    if (materialsError) {
      console.error('Error fetching hotel materials:', materialsError);
    }

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

    // Build dynamic context based on contextMode
    let contextParts: string[] = [];

    // Add hotel basic info
    if (hotelData) {
      contextParts.push(`## INFORMAÇÕES DO HOTEL
Nome: ${hotelData.name}
Cidade: ${hotelData.city}
Categoria: ${hotelData.category || 'Não informada'}
Website: ${hotelData.website || 'Não possui'}
`);
    }

    // Add primary materials context (only if contextMode is 'all' or 'materials')
    if (contextMode === 'all' || contextMode === 'materials') {
      const materialsInfo: string[] = [];
      
      if (hotelMaterials && hotelMaterials.length > 0) {
        contextParts.push(`## MATERIAIS PRIMÁRIOS DISPONÍVEIS\n`);
        
        for (const material of hotelMaterials) {
          const materialName = material.material_type === 'manual' ? 'Manual de Funcionamento' :
                              material.material_type === 'dados' ? 'Briefing de Criação' :
                              material.material_type === 'transcricao' ? 'Transcrição de Kickoff' : material.material_type;
          
          materialsInfo.push(`- ${materialName}: ${material.file_name}`);
          
          // If we have extracted text content, include it
          if (material.text_content) {
            contextParts.push(`### ${materialName}\n${material.text_content.substring(0, 5000)}\n`);
          } else {
            // Try to download and read the file content
            try {
              const fileUrl = material.file_url;
              console.log(`Attempting to fetch material: ${materialName} from ${fileUrl}`);
              
              // Download the file
              const fileResponse = await fetch(fileUrl);
              if (fileResponse.ok) {
                const contentType = fileResponse.headers.get('content-type') || '';
                
                // Only process text-based files
                if (contentType.includes('text') || 
                    material.file_name.endsWith('.txt') || 
                    material.file_name.endsWith('.md')) {
                  const textContent = await fileResponse.text();
                  contextParts.push(`### ${materialName}\n${textContent.substring(0, 10000)}\n`);
                  console.log(`Successfully extracted ${textContent.length} chars from ${materialName}`);
                } else {
                  // For PDFs and other binary formats, we note that we can't read them directly
                  contextParts.push(`### ${materialName}\nArquivo disponível: ${material.file_name} (formato: ${contentType}). O conteúdo deste arquivo não pode ser lido diretamente. Use as informações dos agentes que já processaram este material.\n`);
                }
              }
            } catch (fetchError) {
              console.error(`Error fetching material ${material.file_name}:`, fetchError);
            }
          }
        }
        
        contextParts.push(`Materiais carregados:\n${materialsInfo.join('\n')}\n`);
      } else {
        contextParts.push(`## MATERIAIS PRIMÁRIOS\nNenhum material primário foi enviado ainda para este hotel.\n`);
      }

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
    }

    // Add agent results dynamically (only if contextMode is 'all' or 'agents')
    if (contextMode === 'all' || contextMode === 'agents') {
      if (agentResults && agentResults.length > 0) {
        contextParts.push(`\n## ANÁLISES ESTRATÉGICAS (${agentResults.length} agentes concluídos)\n`);
        
        agentResults.forEach((result) => {
          const title = configMap.get(result.module_id) || `Agente ${result.module_id}`;
          contextParts.push(`### ${title}\n${result.result || 'Sem resultado disponível'}\n`);
        });
      } else {
        contextParts.push(`\n## ANÁLISES ESTRATÉGICAS\nNenhum agente foi executado ainda para este hotel.`);
      }
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
    console.log('Number of materials found:', hotelMaterials?.length || 0);
    console.log('Number of agent results found:', agentResults?.length || 0);

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
