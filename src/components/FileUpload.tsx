import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  hotelId: string;
  field: string;
  currentUrl?: string;
  currentName?: string;
  onUploadComplete: (url: string, fileName: string) => void;
  onRemove: () => void;
  accept?: string;
}

export function FileUpload({
  hotelId,
  field,
  currentUrl,
  currentName,
  onUploadComplete,
  onRemove,
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${hotelId}/${field}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('strategic-materials')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('strategic-materials')
        .getPublicUrl(fileName);

      onUploadComplete(publicUrl, file.name);
      toast.success("Arquivo enviado com sucesso!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar arquivo");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (currentUrl) {
      try {
        // Extract file path from URL
        const urlParts = currentUrl.split('/strategic-materials/');
        if (urlParts[1]) {
          await supabase.storage
            .from('strategic-materials')
            .remove([urlParts[1]]);
        }
      } catch (error) {
        console.error("Error removing file:", error);
      }
    }
    onRemove();
  };

  if (currentUrl && currentName) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
        <FileText className="h-5 w-5 text-primary shrink-0" />
        <a 
          href={currentUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 text-sm text-foreground hover:text-primary truncate"
        >
          {currentName}
        </a>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        id={`file-${field}`}
      />
      <label htmlFor={`file-${field}`}>
        <Button
          variant="outline"
          className="w-full cursor-pointer"
          disabled={isUploading}
          asChild
        >
          <span>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Anexar arquivo
              </>
            )}
          </span>
        </Button>
      </label>
    </div>
  );
}