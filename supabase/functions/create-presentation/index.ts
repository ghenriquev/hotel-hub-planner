// VERSION: 1.0.0 - Create presentation from edited text via Gamma API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNCTION_VERSION = "1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to poll Gamma API for generation status
async function pollGammaGeneration(generationId: string, apiKey: string, maxAttempts = 60): Promise<string | null> {
  console.log(`[create-presentation] Polling Gamma generation ${generationId}...`);
  
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
    
    if (data.status === "completed") {
      if (data.gammaUrl) {
        console.log(`[create-presentation] Got gammaUrl: ${data.gammaUrl}`);
        return data.gammaUrl;
      }
    }
    
    if (data.status === "failed" || data.status === "error") {
      console.error(`[create-presentation] Gamma generation failed:`, data);
      return null;
    }
  }
  
  console.error(`[create-presentation] Gamma polling timeout after ${maxAttempts} attempts`);
  return null;
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

    // Fetch Gamma settings
    const { data: gammaSettings, error: gammaSettingsError } = await supabase
      .from('gamma_settings')
      .select('*')
      .single();
    
    if (gammaSettingsError) {
      console.log("[create-presentation] No gamma settings found, using defaults");
    }

    // Fetch Gamma API key
    const { data: gammaKeyData, error: gammaKeyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .or('name.ilike.%gamma%,key_type.ilike.%gamma%')
      .eq('is_active', true)
      .maybeSingle();
    
    if (gammaKeyError || !gammaKeyData?.api_key) {
      console.error("[create-presentation] No active Gamma API key found:", gammaKeyError);
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
      return new Response(JSON.stringify({ error: "Gamma API error: " + errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const gammaData = await gammaResponse.json();
    console.log("[create-presentation] Gamma generation started:", gammaData);
    
    if (!gammaData.generationId) {
      return new Response(JSON.stringify({ error: "No generation ID received from Gamma" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Poll for completion
    const presentationUrl = await pollGammaGeneration(gammaData.generationId, gammaKeyData.api_key);
    
    if (!presentationUrl) {
      return new Response(JSON.stringify({ error: "Failed to generate presentation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update agent_results with presentation URL
    const { error: updateError } = await supabase
      .from('agent_results')
      .update({ 
        presentation_url: presentationUrl,
        result: text // Also save the edited text
      })
      .eq('hotel_id', hotelId)
      .eq('module_id', moduleId);

    if (updateError) {
      console.error("[create-presentation] Error updating result:", updateError);
    }

    console.log("[create-presentation] Presentation created successfully:", presentationUrl);

    return new Response(JSON.stringify({ 
      success: true,
      presentationUrl 
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
