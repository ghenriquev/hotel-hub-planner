// Manus Task Status Checker - Supports both agent_results and hotel_competitor_data
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sanitize text to remove null bytes and other invalid Unicode that Postgres rejects
function sanitizeForPostgres(text: string): string {
  // Remove null bytes (\u0000) which Postgres cannot store in text columns
  return text.replace(/\u0000/g, '').replace(/\x00/g, '');
}

// Check if content looks like a binary file (PDF, image, etc.)
function isBinaryContent(content: string): boolean {
  // Check for PDF header
  if (content.startsWith('%PDF')) return true;
  // Check for high ratio of non-printable characters
  const nonPrintable = (content.match(/[\x00-\x08\x0E-\x1F\x7F-\x9F]/g) || []).length;
  return nonPrintable > content.length * 0.1; // More than 10% non-printable = binary
}

// Download a file from URL, returning text only if it's actually text content
async function downloadFileAsText(url: string): Promise<string | null> {
  try {
    const fileResponse = await fetch(url);
    if (!fileResponse.ok) {
      console.log(`[manus-check-status] Failed to download file: ${fileResponse.status}`);
      return null;
    }
    
    // Check content-type header first
    const contentType = fileResponse.headers.get('content-type') || '';
    if (contentType.includes('application/pdf') || 
        contentType.includes('application/octet-stream') ||
        contentType.includes('image/')) {
      console.log(`[manus-check-status] Skipping binary file (content-type: ${contentType})`);
      return null;
    }
    
    const fileContent = await fileResponse.text();
    console.log(`[manus-check-status] Downloaded file content: ${fileContent.length} chars`);
    
    // Double-check: even if content-type was text, verify the content isn't binary
    if (isBinaryContent(fileContent)) {
      console.log("[manus-check-status] Skipping file: content is binary (PDF or similar)");
      return null;
    }
    
    if (fileContent.length > 200) {
      return sanitizeForPostgres(fileContent);
    }
    return null;
  } catch (err) {
    console.error("[manus-check-status] Error downloading file:", err);
    return null;
  }
}

// Extract clean text from Manus response, including downloading output files
async function extractManusResult(data: any): Promise<string | null> {
  console.log("[manus-check-status] Extracting result from Manus response");
  
  // If already a simple string
  if (typeof data.result === 'string' && !data.result.startsWith('[') && !data.result.startsWith('{')) {
    console.log("[manus-check-status] Found simple string result");
    return sanitizeForPostgres(data.result);
  }
  if (typeof data.output === 'string' && !data.output.startsWith('[') && !data.output.startsWith('{')) {
    console.log("[manus-check-status] Found simple string output");
    return sanitizeForPostgres(data.output);
  }
  if (typeof data.content === 'string' && !data.content.startsWith('[') && !data.content.startsWith('{')) {
    console.log("[manus-check-status] Found simple string content");
    return sanitizeForPostgres(data.content);
  }
  
  // Try to get messages array from various possible locations
  let messages = data.messages || data.result || data.output;
  
  // If it's a string that looks like JSON, parse it
  if (typeof messages === 'string') {
    try {
      messages = JSON.parse(messages);
    } catch {
      return sanitizeForPostgres(messages);
    }
  }
  
  if (!Array.isArray(messages)) {
    console.log("[manus-check-status] No messages array found");
    return null;
  }
  
  console.log(`[manus-check-status] Processing ${messages.length} messages`);
  
  // First pass: look for output_file (complete report) - only text files
  for (const msg of messages) {
    if (msg.role !== 'assistant' || !msg.content) continue;
    
    if (Array.isArray(msg.content)) {
      for (const item of msg.content) {
        const fileUrl = item.file_url || item.fileUrl;
        if (item.type === 'output_file' && fileUrl) {
          // Skip known binary file extensions
          const urlLower = fileUrl.toLowerCase().split('?')[0];
          if (urlLower.endsWith('.pdf') || urlLower.endsWith('.png') || 
              urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg') ||
              urlLower.endsWith('.zip') || urlLower.endsWith('.xlsx')) {
            console.log(`[manus-check-status] Skipping binary output_file: ${urlLower.split('/').pop()}`);
            continue;
          }
          
          console.log(`[manus-check-status] Found output_file: ${fileUrl}`);
          const content = await downloadFileAsText(fileUrl);
          if (content) return content;
        }
      }
    }
  }
  
  // Second pass: extract text from output_text messages
  const assistantTexts: string[] = [];
  
  for (const msg of messages) {
    if (msg.role !== 'assistant' || !msg.content) continue;
    
    if (Array.isArray(msg.content)) {
      for (const item of msg.content) {
        if (item.type === 'output_text' && item.text) {
          if (!item.text.includes('Entendido! Vou realizar') && 
              !item.text.includes('Vou começar') &&
              item.text.length > 200) {
            assistantTexts.push(sanitizeForPostgres(item.text));
          }
        }
      }
    } else if (typeof msg.content === 'string' && msg.content.length > 200) {
      assistantTexts.push(sanitizeForPostgres(msg.content));
    }
  }
  
  console.log(`[manus-check-status] Found ${assistantTexts.length} text segments`);
  
  return assistantTexts.length > 0 ? assistantTexts[assistantTexts.length - 1] : null;
}

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
    let response = await fetch(`https://api.manus.ai/v1/tasks/${taskId}`, {
      method: "GET",
      headers: {
        "API_KEY": MANUS_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      console.log("[manus-check-status] API_KEY failed with 401, trying Authorization Bearer...");
      response = await fetch(`https://api.manus.ai/v1/tasks/${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${MANUS_API_KEY}`,
          "Content-Type": "application/json",
        },
      });
    }

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
        // Extract clean text from Manus response (now async)
        result = await extractManusResult(data);
        console.log("[manus-check-status] Task completed with extracted result length:", result?.length || 0);
        if (result) {
          console.log("[manus-check-status] Result preview:", result.substring(0, 500));
        }
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