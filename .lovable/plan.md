

## Plano: Adicionar Sharing Options na API do Gamma

### Problema
Ao criar apresentações via Gamma API, o documento não é compartilhado automaticamente com permissão de edição. É necessário compartilhar manualmente depois.

### Solução

**1. Edge Function `create-presentation/index.ts`**
- Aceitar um novo parâmetro opcional `userEmail` no body da requisição
- Se não vier no body, buscar o e-mail do usuário autenticado via token JWT (header Authorization)
- Adicionar `sharingOptions` ao payload do Gamma:
  - `workspaceAccess: "edit"` — sempre incluído
  - `emailOptions` — incluído apenas se um e-mail for encontrado (nunca enviar array vazio)

**2. Chamadas no frontend (3 arquivos)**
- `src/pages/StrategicSummary.tsx` — passar o e-mail do usuário logado no body
- `src/pages/FinalReport.tsx` — idem
- `src/pages/AgentModule.tsx` — idem
- O e-mail pode ser obtido via `supabase.auth.getUser()` antes da chamada

### Detalhes técnicos

Na Edge Function, após construir o `gammaPayload` (linha ~201), adicionar:

```typescript
// Sharing options
const sharingOptions: Record<string, any> = {
  workspaceAccess: "edit"
};

if (userEmail) {
  sharingOptions.emailOptions = {
    recipients: [userEmail],
    access: "edit"
  };
}

gammaPayload.sharingOptions = sharingOptions;
```

O `userEmail` será extraído de:
1. Body da requisição (`req.json()`) — se o frontend enviar
2. Fallback: buscar o usuário via `supabase.auth.getUser()` usando o token do header Authorization

No frontend, cada chamada passará o e-mail:
```typescript
const { data: { user } } = await supabase.auth.getUser();
// ...
supabase.functions.invoke('create-presentation', {
  body: { hotelId, moduleId, text, userEmail: user?.email }
});
```

### Arquivos alterados
- `supabase/functions/create-presentation/index.ts` — adicionar sharingOptions ao payload
- `src/pages/StrategicSummary.tsx` — enviar userEmail
- `src/pages/FinalReport.tsx` — enviar userEmail  
- `src/pages/AgentModule.tsx` — enviar userEmail

