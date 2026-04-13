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

    // First check if we have a stored pdf_url
    const { data: result } = await supabase
      .from('agent_results')
      .select('pdf_url')
      .eq('presentation_url', presentationUrl)
      .maybeSingle();

    let pdfSourceUrl: string;

    if (result?.pdf_url) {
      // Use stored PDF URL
      pdfSourceUrl = result.pdf_url;
    } else {
      // Generate PDF URL from Gamma presentation URL by appending /pdf
      // Gamma URLs look like: https://gamma.app/docs/TITLE-ID?mode=doc
      // PDF export: https://gamma.app/docs/TITLE-ID/pdf
      let gammaUrl = presentationUrl.trim();
      
      // Remove query parameters
      const qIndex = gammaUrl.indexOf('?');
      if (qIndex !== -1) {
        gammaUrl = gammaUrl.substring(0, qIndex);
      }
      
      // Remove trailing slash
      if (gammaUrl.endsWith('/')) {
        gammaUrl = gammaUrl.slice(0, -1);
      }
      
      pdfSourceUrl = `${gammaUrl}/pdf`;
      console.log(`[export-pdf] No stored PDF, using Gamma export: ${pdfSourceUrl}`);
    }

    // Fetch the PDF
    const pdfResponse = await fetch(pdfSourceUrl, {
      redirect: 'follow',
      headers: {
        'Accept': 'application/pdf,*/*',
      },
    });

    if (!pdfResponse.ok) {
      console.error(`[export-pdf] PDF fetch failed: ${pdfResponse.status} from ${pdfSourceUrl}`);
      return new Response(JSON.stringify({ 
        error: 'Não foi possível gerar o PDF. Verifique se a apresentação está acessível.' 
      }), {
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
