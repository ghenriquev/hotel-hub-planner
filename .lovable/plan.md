
## Plano: Corrigir Visualização do Manual de Funcionamento (Upload)

### Problema Identificado
Quando o usuário clica em "Visualizar" o Manual de Funcionamento enviado via upload, o sistema usa `window.open(url, '_blank')` que abre a URL direta do Supabase Storage. Isso resulta em uma aba preta/vazia porque:
1. Alguns navegadores não renderizam PDFs diretamente de URLs de storage
2. Headers de segurança podem bloquear a exibição inline

### Solução
Usar o **Google Docs Viewer** em um modal, igual ao componente `FileUpload.tsx` já faz para outros arquivos.

---

### Arquivos a Modificar

#### `src/pages/HotelDetail.tsx`

**Adicionar estado para o modal:**
```typescript
const [isManualViewerOpen, setIsManualViewerOpen] = useState(false);
const [isManualDocLoading, setIsManualDocLoading] = useState(true);
```

**Alterar o botão de visualização (linha ~616):**
De:
```typescript
onClick={() => window.open(manualFormData.uploaded_file_url, '_blank')}
```
Para:
```typescript
onClick={() => setIsManualViewerOpen(true)}
```

**Adicionar modal de visualização após a seção do manual:**
```typescript
<Dialog open={isManualViewerOpen} onOpenChange={(open) => {
  setIsManualViewerOpen(open);
  if (!open) setIsManualDocLoading(true);
}}>
  <DialogContent className="max-w-5xl h-[85vh] p-0">
    <DialogHeader className="p-4 pb-0">
      <DialogTitle className="text-sm truncate pr-8">
        {manualFormData?.uploaded_file_name}
      </DialogTitle>
    </DialogHeader>
    <div className="flex-1 p-4 pt-2 h-full relative">
      {isManualDocLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <iframe
        src={`https://docs.google.com/viewer?url=${encodeURIComponent(manualFormData?.uploaded_file_url || '')}&embedded=true`}
        className="w-full h-full border-0 rounded"
        title={manualFormData?.uploaded_file_name}
        onLoad={() => setIsManualDocLoading(false)}
      />
    </div>
  </DialogContent>
</Dialog>
```

---

### Resumo das Mudanças
1. Adicionar 2 estados: `isManualViewerOpen` e `isManualDocLoading`
2. Alterar o `onClick` do botão "Visualizar" para abrir o modal
3. Adicionar componente `Dialog` com iframe usando Google Docs Viewer

### Resultado Esperado
Após a implementação:
- O PDF do Manual de Funcionamento será visualizado corretamente em um modal
- O Google Docs Viewer renderizará o PDF sem problemas de compatibilidade
- Comportamento consistente com outros arquivos visualizados no sistema
