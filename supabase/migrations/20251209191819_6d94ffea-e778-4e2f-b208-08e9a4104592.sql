-- Add competitor agent configuration fields
ALTER TABLE research_settings 
  ADD COLUMN IF NOT EXISTS competitor_prompt TEXT,
  ADD COLUMN IF NOT EXISTS competitor_llm_model TEXT DEFAULT 'google/gemini-3-pro-preview';

-- Set default prompt for competitor analysis
UPDATE research_settings 
SET competitor_prompt = 'Você é um especialista em análise competitiva para o mercado hoteleiro brasileiro. Analise os sites dos concorrentes fornecidos e extraia:

1. **Posicionamento de Marca**: Como o hotel se posiciona no mercado
2. **Diferenciais Comunicados**: Principais atributos destacados
3. **Proposta de Valor**: O que prometem aos hóspedes
4. **Público-Alvo**: Quem parecem querer atrair
5. **Estratégia de Comunicação**: Tom, estilo e mensagens principais
6. **Pontos Fortes**: O que fazem bem na comunicação digital
7. **Oportunidades para o Hotel Analisado**: O que nosso cliente pode aprender ou fazer diferente

Forneça uma análise estruturada e acionável para cada concorrente.'
WHERE competitor_prompt IS NULL;