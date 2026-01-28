
## Plano: Corrigir Verificação do Manual de Funcionamento

### Problema Identificado
O sistema possui duas formas de receber o Manual de Funcionamento:
1. Upload direto na seção "Materiais Primários" → salva em `hotel_materials`
2. Upload/formulário na seção "Manual de Funcionamento" → salva em `hotel_manual_data`

Os hooks de verificação de prontidão (`useAgentReadiness` e `useAgentsReadiness`) verificam apenas `hotel_materials`, ignorando manuais enviados via `hotel_manual_data`.

### Solução
Modificar os hooks para verificar AMBAS as fontes de dados para o material "manual".

---

### Arquivos a Modificar

#### 1. `src/hooks/useAgentReadiness.ts`
- Importar o hook `useHotelManualData`
- Na verificação do caso `'manual'`, além de verificar `getMaterial('manual')`, também verificar se `manualData?.is_complete === true`
- O manual estará "pronto" se existir em QUALQUER uma das duas fontes

#### 2. `src/hooks/useAgentsReadiness.ts`
- Aplicar a mesma lógica: importar `useHotelManualData`
- Verificar ambas as fontes para o material "manual"

---

### Detalhes Técnicos

**Mudança no `useAgentReadiness.ts`:**

```typescript
// Importar o hook
import { useHotelManualData } from './useHotelManualData';

// Dentro do hook
const { manualData, loading: manualDataLoading } = useHotelManualData(hotelId);

// Na verificação do case 'manual':
case 'manual':
  // Manual pode estar em hotel_materials OU em hotel_manual_data
  const hasManualInMaterials = !!getMaterial('manual');
  const hasManualInFormData = manualData?.is_complete === true && 
    (manualData?.input_method === 'upload' || manualData?.input_method === 'form');
  ready = hasManualInMaterials || hasManualInFormData;
  label = PRIMARY_MATERIALS_LABELS[materialId];
  type = 'primary';
  break;
```

**Mudança no `useAgentsReadiness.ts`:**

```typescript
// Mesma lógica aplicada
import { useHotelManualData } from './useHotelManualData';

const { manualData, loading: manualDataLoading } = useHotelManualData(hotelId);

// Na verificação:
case 'manual':
  ready = !!getMaterial('manual') || 
          (manualData?.is_complete === true && 
           (manualData?.input_method === 'upload' || manualData?.input_method === 'form'));
  label = PRIMARY_MATERIALS_LABELS[materialId];
  break;
```

---

### Resultado Esperado
Após a implementação:
- Manuais enviados via upload na seção "Manual de Funcionamento" serão reconhecidos pelos agentes
- Manuais enviados diretamente em "Materiais Primários" continuarão funcionando normalmente
- O indicador "Pronto para iniciar" aparecerá corretamente quando o manual estiver disponível em qualquer uma das fontes
