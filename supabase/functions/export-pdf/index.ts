import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract Gamma generation ID from a gamma.app URL
// e.g. https://gamma.app/docs/KICK-OFF-abc123?mode=doc → "KICK-OFF-abc123"
function extractGammaId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    // pathname: /docs/{id}
    const docsIndex = parts.indexOf('docs');
    if (docsIndex !== -1 && parts[docsIndex + 1]) {
      return parts[docsIndex + 1];
    }
  } catch (_) {}
  return null;
}

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
    const { data: gammaKeyData } = await supabase
      .from('api_keys')
      .select('api_key')
      .or('name.ilike.%gamma%,key_type.ilike.%gamma%')
      .eq('is_active', true)
      .maybeSingle();

    if (!gammaKeyData?.api_key) {
      return new Response(JSON.stringify({ error: 'Gamma API key not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract generation ID from the Gamma URL and call GET /v1.0/generations/{id}
    const gammaId = extractGammaId(presentationUrl);

    if (!gammaId) {
      return new Response(JSON.stringify({ error: 'Could not extract Gamma ID from URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[export-pdf] Fetching generation status for id: ${gammaId}`);

    const generationRes = await fetch(`https://public-api.gamma.app/v1.0/generations/${gammaId}`, {
      headers: { 'X-API-KEY': gammaKeyData.api_key },
    });

    if (!generationRes.ok) {
      const errText = await generationRes.text();
      console.error(`[export-pdf] Gamma API error ${generationRes.status}:`, errText);
      return new Response(JSON.stringify({ error: 'Erro ao buscar exportUrl do Gamma.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const generation = await generationRes.json();
    console.log(`[export-pdf] Generation response:`, JSON.stringify(generation));

    const exportUrl: string | undefined = generation.exportUrl;

    if (!exportUrl) {
      return new Response(JSON.stringify({ error: 'exportUrl não disponível para esta apresentação.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[export-pdf] Downloading from exportUrl: ${exportUrl}`);

    const pdfResponse = await fetch(exportUrl, { redirect: 'follow' });

    if (!pdfResponse.ok) {
      console.error(`[export-pdf] PDF fetch failed: ${pdfResponse.status}`);
      return new Response(JSON.stringify({ error: 'Não foi possível baixar o PDF.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await pdfResponse.arrayBuffer();
    console.log(`[export-pdf] Success, size: ${body.byteLength} bytes`);

    return new Response(body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="apresentacao.pdf"',
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
