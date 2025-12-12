// Manus Agent Mode Integration
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("[manus-agent] Request received");
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelId, moduleId, prompt, materials } = await req.json();
    
    console.log(`[manus-agent] Creating Manus task for hotel: ${hotelId}, module: ${moduleId}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch Manus API key from api_keys table
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .or('key_type.eq.manus,name.ilike.%manus%')
      .eq('is_active', true)
      .maybeSingle();

    if (keyError || !apiKeyData) {
      console.error("[manus-agent] No active Manus API key found:", keyError);
      throw new Error("No active Manus API key found. Please configure it in Settings > API Keys.");
    }

    const MANUS_API_KEY = apiKeyData.api_key;
    console.log("[manus-agent] Manus API key found");

    // Build the full prompt with materials context
    let fullPrompt = prompt;
    if (materials) {
      fullPrompt += "\n\n---\n\nMATERIAIS PARA ANÁLISE:\n" + materials;
    }

    // Call Manus API to create task
    console.log("[manus-agent] Calling Manus API...");
    
    const requestBody = JSON.stringify({
      prompt: fullPrompt,
      agentProfile: "manus-1.5",
      taskMode: "agent"
    });

    // Try with API_KEY header first
    console.log("[manus-agent] Trying with API_KEY header...");
    let response = await fetch("https://api.manus.ai/v1/tasks", {
      method: "POST",
      headers: {
        "API_KEY": MANUS_API_KEY,
        "Content-Type": "application/json",
      },
      body: requestBody,
    });

    // If 401, retry with Authorization Bearer format
    if (response.status === 401) {
      console.log("[manus-agent] API_KEY failed with 401, trying Authorization Bearer...");
      response = await fetch("https://api.manus.ai/v1/tasks", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${MANUS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: requestBody,
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[manus-agent] Manus API error:", response.status, errorText);
      
      // Update status to error so user can retry
      await supabase.from('agent_results').upsert({
        hotel_id: hotelId,
        module_id: moduleId,
        status: 'error',
        result: `Erro Manus: ${response.status} - ${errorText.substring(0, 200)}`,
      }, { onConflict: 'hotel_id,module_id' });
      
      if (response.status === 401) {
        throw new Error("Manus API key inválida. Verifique a chave em Settings > API Keys.");
      }
      if (response.status === 429) {
        throw new Error("Limite de requisições do Manus excedido. Tente novamente mais tarde.");
      }
      
      throw new Error(`Manus API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("[manus-agent] Manus response:", JSON.stringify(data).substring(0, 200));

    const taskId = data.task_id || data.id;
    if (!taskId) {
      console.error("[manus-agent] No task_id in response:", data);
      
      await supabase.from('agent_results').upsert({
        hotel_id: hotelId,
        module_id: moduleId,
        status: 'error',
        result: 'Manus não retornou task_id',
      }, { onConflict: 'hotel_id,module_id' });
      
      throw new Error("Manus API did not return a task ID");
    }

    // Update agent_results with Manus task info
    const { error: updateError } = await supabase
      .from('agent_results')
      .upsert({
        hotel_id: hotelId,
        module_id: moduleId,
        status: 'processing_manus',
        result: null,
        presentation_url: null,
        llm_model_used: 'manus/agent-1.5',
        generated_at: null,
      }, { onConflict: 'hotel_id,module_id' });

    if (updateError) {
      console.error("[manus-agent] Error updating status:", updateError);
    }

    // Store task_id in a way we can retrieve it (using result field temporarily)
    await supabase
      .from('agent_results')
      .update({ 
        result: JSON.stringify({ manus_task_id: taskId, status: 'processing' }) 
      })
      .eq('hotel_id', hotelId)
      .eq('module_id', moduleId);

    console.log(`[manus-agent] Task ${taskId} created and status updated`);

    return new Response(JSON.stringify({ 
      success: true,
      taskId: taskId,
      message: "Tarefa criada no Manus. O resultado será atualizado automaticamente."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[manus-agent] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
