// VERSION: 2.0.0 - Background processing with persistent status
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNCTION_VERSION = "2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Declare EdgeRuntime for TypeScript
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<any>) => void;
} | undefined;

// Helper function to poll Gamma API for generation status
async function pollGammaGeneration(
  generationId: string, 
  apiKey: string, 
  supabase: any,
  hotelId: string,
  moduleId: number,
  text: string,
  maxAttempts = 60
): Promise<void> {
  console.log(`[create-presentation] Background polling started for ${generationId}...`);
  
  try {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const response = await fetch(`https://public-api.gamma.app/v1.0/generations/${generationId}`, {
        headers: {
          "X-API-KEY": apiKey,
        },
      });
      
      if (!response.ok) {
        console.error(`[create-presentation] Gamma poll error: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`[create-presentation] Gamma status: ${data.status}, attempt ${attempt + 1}/${maxAttempts}`);
      
      if (data.status === "completed" && data.gammaUrl) {
        console.log(`[create-presentation] Success! URL: ${data.gammaUrl}`);
        
        // Update with completed status
        const { error: updateError } = await supabase
          .from('agent_results')
          .update({ 
            presentation_url: data.gammaUrl,
            presentation_status: 'completed',
            result: text
          })
          .eq('hotel_id', hotelId)
          .eq('module_id', moduleId);

        if (updateError) {
          console.error("[create-presentation] Error updating result:", updateError);
        }
        return;
      }
      
      if (data.status === "failed" || data.status === "error") {
        console.error(`[create-presentation] Gamma generation failed:`, data);
        
        // Update with error status
        await supabase
          .from('agent_results')
          .update({ presentation_status: 'error' })
          .eq('hotel_id', hotelId)
          .eq('module_id', moduleId);
        return;
      }
    }
    
    // Timeout - mark as error
    console.error(`[create-presentation] Polling timeout after ${maxAttempts} attempts`);
    await supabase
      .from('agent_results')
      .update({ presentation_status: 'error' })
      .eq('hotel_id', hotelId)
      .eq('module_id', moduleId);
      
  } catch (error) {
    console.error("[create-presentation] Background processing error:", error);
    await supabase
      .from('agent_results')
      .update({ presentation_status: 'error' })
      .eq('hotel_id', hotelId)
      .eq('module_id', moduleId);
  }
}

serve(async (req) => {
  console.log(`[create-presentation] ===== FUNCTION VERSION ${FUNCTION_VERSION} =====`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hotelId, moduleId, text } = await req.json();
    
    console.log(`[create-presentation] v${FUNCTION_VERSION} - Creating presentation for hotel: ${hotelId}, module: ${moduleId}`);
    
    if (!hotelId || moduleId === undefined || !text) {
      throw new Error("hotelId, moduleId, and text are required");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Immediately set status to generating
    const { error: statusError } = await supabase
      .from('agent_results')
      .update({ presentation_status: 'generating' })
      .eq('hotel_id', hotelId)
      .eq('module_id', moduleId);

    if (statusError) {
      console.error("[create-presentation] Error setting generating status:", statusError);
    }

    // Fetch Gamma settings
    const { data: gammaSettings } = await supabase
      .from('gamma_settings')
      .select('*')
      .single();

    // Fetch Gamma API key
    const { data: gammaKeyData, error: gammaKeyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .or('name.ilike.%gamma%,key_type.ilike.%gamma%')
      .eq('is_active', true)
      .maybeSingle();
    
    if (gammaKeyError || !gammaKeyData?.api_key) {
      console.error("[create-presentation] No active Gamma API key found:", gammaKeyError);
      
      await supabase
        .from('agent_results')
        .update({ presentation_status: 'error' })
        .eq('hotel_id', hotelId)
        .eq('module_id', moduleId);
        
      return new Response(JSON.stringify({ error: "Gamma API key not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[create-presentation] Creating Gamma presentation...");

    // Build Gamma payload
    const gammaPayload: Record<string, any> = {
      inputText: text,
      format: gammaSettings?.format || "presentation",
      textMode: gammaSettings?.text_mode || "generate",
      numCards: gammaSettings?.num_cards || 10,
      cardSplit: gammaSettings?.card_split || "auto",
    };
    
    if (gammaSettings?.theme_id && gammaSettings.theme_id.trim() !== '') {
      gammaPayload.themeId = gammaSettings.theme_id.trim();
    }
    
    if (gammaSettings?.additional_instructions) {
      gammaPayload.additionalInstructions = gammaSettings.additional_instructions;
    }
    
    gammaPayload.textOptions = {
      amount: gammaSettings?.text_amount || "detailed",
      tone: gammaSettings?.text_tone || "professional",
      audience: gammaSettings?.text_audience || "hotel management professionals",
      language: gammaSettings?.text_language || "pt-br"
    };
    
    if (gammaSettings?.image_source && gammaSettings.image_source !== 'none') {
      gammaPayload.imageOptions = {
        source: gammaSettings.image_source || "aiGenerated",
        model: gammaSettings.image_model || "imagen-4-pro",
        style: gammaSettings.image_style || "photorealistic"
      };
    }
    
    if (gammaSettings?.card_dimensions && gammaSettings.card_dimensions !== 'fluid') {
      gammaPayload.cardOptions = {
        dimensions: gammaSettings.card_dimensions
      };
    }
    
    console.log(`[create-presentation] Gamma payload:`, JSON.stringify(gammaPayload, null, 2));
    
    const gammaResponse = await fetch("https://public-api.gamma.app/v1.0/generations", {
      method: "POST",
      headers: {
        "X-API-KEY": gammaKeyData.api_key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gammaPayload),
    });
    
    if (!gammaResponse.ok) {
      const errorText = await gammaResponse.text();
      console.error("[create-presentation] Gamma API error:", gammaResponse.status, errorText);
      
      await supabase
        .from('agent_results')
        .update({ presentation_status: 'error' })
        .eq('hotel_id', hotelId)
        .eq('module_id', moduleId);
        
      return new Response(JSON.stringify({ error: "Gamma API error: " + errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const gammaData = await gammaResponse.json();
    console.log("[create-presentation] Gamma generation started:", gammaData);
    
    if (!gammaData.generationId) {
      await supabase
        .from('agent_results')
        .update({ presentation_status: 'error' })
        .eq('hotel_id', hotelId)
        .eq('module_id', moduleId);
        
      return new Response(JSON.stringify({ error: "No generation ID received from Gamma" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Start background polling
    const pollingPromise = pollGammaGeneration(
      gammaData.generationId, 
      gammaKeyData.api_key, 
      supabase, 
      hotelId, 
      moduleId, 
      text
    );

    // Use EdgeRuntime.waitUntil if available, otherwise just start the promise
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) {
      EdgeRuntime.waitUntil(pollingPromise);
      console.log("[create-presentation] Background polling started with EdgeRuntime.waitUntil");
    } else {
      // Fallback: just start the promise without awaiting
      pollingPromise.catch(err => console.error("[create-presentation] Background polling error:", err));
      console.log("[create-presentation] Background polling started without EdgeRuntime");
    }

    // Return immediately
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Presentation generation started in background',
      generationId: gammaData.generationId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[create-presentation] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
