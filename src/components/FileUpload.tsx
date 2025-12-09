import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, FileText, Loader2, Eye, Download } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [isViewerOpen, setIsViewerOpen] = useState(false);
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

  const handleDownload = () => {
    if (currentUrl) {
      const link = document.createElement('a');
      link.href = currentUrl;
      link.download = currentName || 'arquivo';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (currentUrl && currentName) {
    return (
      <>
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <span className="flex-1 text-sm text-foreground truncate">
            {currentName}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setIsViewerOpen(true)}
            title="Visualizar arquivo"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleDownload}
            title="Baixar arquivo"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleRemove}
            title="Remover arquivo"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
          <DialogContent className="max-w-5xl h-[85vh] p-0">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="text-sm truncate pr-8">{currentName}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 p-4 pt-2 h-full">
              <iframe
                src={currentUrl}
                className="w-full h-full border-0 rounded"
                title={currentName}
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
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