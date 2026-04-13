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

    // Look up the agent_result that has this presentation_url
    const { data: result, error: queryError } = await supabase
      .from('agent_results')
      .select('pdf_url')
      .eq('presentation_url', presentationUrl)
      .maybeSingle();

    if (queryError) {
      console.error("[export-pdf] Query error:", queryError);
      return new Response(JSON.stringify({ error: 'Failed to look up presentation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!result?.pdf_url) {
      return new Response(JSON.stringify({ error: 'PDF não disponível para esta apresentação. Recrie a apresentação para gerar o PDF.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the PDF from storage and return it
    const pdfResponse = await fetch(result.pdf_url);

    if (!pdfResponse.ok) {
      console.error(`[export-pdf] Storage fetch failed: ${pdfResponse.status}`);
      return new Response(JSON.stringify({ error: 'Failed to fetch PDF from storage' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await pdfResponse.arrayBuffer();

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
