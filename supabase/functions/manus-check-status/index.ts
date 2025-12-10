// Manus Task Status Checker - Supports both agent_results and hotel_competitor_data
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("[manus-check-status] Request received");
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { hotelId, moduleId, taskId, competitorNumber, type } = body;
    
    // Determine the type of task we're checking
    const taskType = type || (competitorNumber ? 'competitor' : 'agent');
    
    console.log(`[manus-check-status] Checking task ${taskId} - type: ${taskType}, hotel: ${hotelId}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch Manus API key
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .or('key_type.eq.manus,name.ilike.%manus%')
      .eq('is_active', true)
      .maybeSingle();

    if (keyError || !apiKeyData) {
      throw new Error("No active Manus API key found");
    }

    const MANUS_API_KEY = apiKeyData.api_key;

    // Check task status from Manus API
    console.log(`[manus-check-status] Fetching status from Manus API for task ${taskId}`);
    const response = await fetch(`https://api.manus.ai/v1/tasks/${taskId}`, {
      method: "GET",
      headers: {
        "API_KEY": MANUS_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[manus-check-status] Manus API error:", response.status, errorText);
      throw new Error(`Manus API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("[manus-check-status] Manus task status:", data.status);

    // Map Manus status to our status
    let newStatus: string;
    let result: string | null = null;

    switch (data.status) {
      case 'completed':
      case 'done':
        newStatus = 'completed';
        // Extract the result from Manus response
        result = data.result || data.output || data.content || 
                 (data.messages && data.messages.length > 0 ? data.messages[data.messages.length - 1].content : null);
        console.log("[manus-check-status] Task completed with result length:", result?.length || 0);
        break;
      case 'failed':
      case 'error':
        newStatus = 'error';
        result = data.error || data.message || 'Erro no processamento do Manus';
        break;
      case 'running':
      case 'pending':
      case 'processing':
      default:
        newStatus = 'processing_manus';
        break;
    }

    // Update the appropriate table based on task type
    if (taskType === 'competitor') {
      // Update hotel_competitor_data table
      if (newStatus === 'completed' || newStatus === 'error') {
        const updateData: any = {
          analysis_status: newStatus,
        };
        
        if (newStatus === 'completed' && result) {
          updateData.generated_analysis = result;
          updateData.crawled_at = new Date().toISOString();
        } else if (newStatus === 'error') {
          updateData.error_message = result;
        }

        const { error: updateError } = await supabase
          .from('hotel_competitor_data')
          .update(updateData)
          .eq('hotel_id', hotelId)
          .eq('competitor_number', competitorNumber);

        if (updateError) {
          console.error("[manus-check-status] Error updating competitor data:", updateError);
        } else {
          console.log(`[manus-check-status] Updated competitor ${competitorNumber} status to ${newStatus}`);
        }
      }
    } else {
      // Update agent_results table (original behavior)
      if (newStatus === 'completed' || newStatus === 'error') {
        const { error: updateError } = await supabase
          .from('agent_results')
          .update({
            status: newStatus,
            result: result,
            generated_at: newStatus === 'completed' ? new Date().toISOString() : null,
          })
          .eq('hotel_id', hotelId)
          .eq('module_id', moduleId);

        if (updateError) {
          console.error("[manus-check-status] Error updating agent result:", updateError);
        } else {
          console.log(`[manus-check-status] Updated agent status to ${newStatus}`);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      status: newStatus,
      taskStatus: data.status,
      result: newStatus === 'completed' ? result : null,
      type: taskType
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[manus-check-status] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
