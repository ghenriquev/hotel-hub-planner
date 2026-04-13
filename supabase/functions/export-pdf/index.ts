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
    const { presentationUrl } = await req.json();

    if (!presentationUrl) {
      return new Response(JSON.stringify({ error: 'presentationUrl is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch Gamma API key
    const { data: gammaKeyData, error: gammaKeyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .or('name.ilike.%gamma%,key_type.ilike.%gamma%')
      .eq('is_active', true)
      .maybeSingle();

    if (gammaKeyError || !gammaKeyData?.api_key) {
      console.error("[export-pdf] No active Gamma API key found:", gammaKeyError);
      return new Response(JSON.stringify({ error: 'Gamma API key not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Strip query params and hash, then append /pdf
    const baseUrl = presentationUrl.split('?')[0].split('#')[0];
    const pdfUrl = baseUrl.endsWith('/') ? `${baseUrl}pdf` : `${baseUrl}/pdf`;

    console.log(`[export-pdf] Fetching: ${pdfUrl}`);

    const response = await fetch(pdfUrl, {
      headers: {
        'X-API-KEY': gammaKeyData.api_key,
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[export-pdf] Gamma error ${response.status}:`, errorText);
      return new Response(JSON.stringify({ error: `Gamma returned ${response.status}` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contentType = response.headers.get('Content-Type') || 'application/pdf';
    const body = await response.arrayBuffer();

    console.log(`[export-pdf] Success, content-type: ${contentType}, size: ${body.byteLength}`);

    return new Response(body, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': 'attachment; filename="presentation.pdf"',
      },
    });

  } catch (error) {
    console.error("[export-pdf] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
