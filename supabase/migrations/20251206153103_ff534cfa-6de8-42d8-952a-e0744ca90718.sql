-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table (separate from users for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create agent_configs table (admin editable)
CREATE TABLE public.agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id INTEGER UNIQUE NOT NULL,
  module_title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  output_type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on agent_configs
ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;

-- Everyone can read agent configs
CREATE POLICY "Anyone can read agent configs"
ON public.agent_configs
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify agent configs
CREATE POLICY "Admins can manage agent configs"
ON public.agent_configs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create agent_results table
CREATE TABLE public.agent_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id TEXT NOT NULL,
  module_id INTEGER NOT NULL,
  result TEXT,
  status TEXT DEFAULT 'pending',
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hotel_id, module_id)
);

-- Enable RLS on agent_results
ALTER TABLE public.agent_results ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read agent results
CREATE POLICY "Authenticated users can read agent results"
ON public.agent_results
FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert/update agent results
CREATE POLICY "Authenticated users can manage agent results"
ON public.agent_results
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger for updated_at on agent_configs
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_configs_updated_at
BEFORE UPDATE ON public.agent_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial agent configurations
INSERT INTO public.agent_configs (module_id, module_title, prompt, output_type) VALUES
(0, 'Apresentação do Hotel', 'Você é um especialista em marketing hoteleiro. Analise os materiais fornecidos (Manual de Identidade, Dados do Hotel, Transcrição de Reunião) e crie uma apresentação executiva completa do hotel incluindo: visão geral, proposta de valor, diferenciais competitivos, público-alvo atual e posicionamento de mercado. Seja específico e use dados dos materiais.', 'presentation'),
(1, 'Persona / Estudo de Público-Alvo', 'Você é um especialista em pesquisa de mercado hoteleiro. Com base nos materiais fornecidos, identifique e descreva detalhadamente as personas do hotel: perfil demográfico, comportamento de compra, motivações de viagem, canais de pesquisa preferidos, objeções comuns e jornada de compra. Crie de 2 a 4 personas distintas.', 'text'),
(2, 'Reputação Online', 'Você é um analista de reputação digital para hotéis. Analise os materiais e forneça uma avaliação da reputação online do hotel considerando: Google Reviews, TripAdvisor, OTAs (Booking, Expedia), redes sociais. Identifique pontos fortes mencionados, críticas recorrentes e oportunidades de melhoria na gestão de reviews.', 'text'),
(3, 'Comparativo com Concorrentes', 'Você é um estrategista de competitividade hoteleira. Com base nos materiais, elabore uma análise comparativa do hotel versus seus principais concorrentes diretos e indiretos. Compare: tarifas, localização, serviços, reputação, presença digital e diferenciais. Identifique gaps e vantagens competitivas.', 'text'),
(4, 'SWOT Digital', 'Você é um consultor de estratégia digital para hotéis. Crie uma análise SWOT focada na presença digital do hotel: Forças (o que fazem bem online), Fraquezas (gaps digitais), Oportunidades (tendências e canais não explorados) e Ameaças (concorrência digital, mudanças de algoritmo). Seja específico com exemplos dos materiais.', 'swot'),
(5, 'Distribuição e Canais de Venda', 'Você é um especialista em revenue management e distribuição hoteleira. Analise os canais de venda atuais do hotel e recomende uma estratégia de distribuição otimizada. Avalie: site direto, OTAs, metabuscadores, GDS, operadoras, corporate. Sugira mix ideal e ações para aumentar vendas diretas.', 'text'),
(6, 'Validação de Perfis em OTAs', 'Você é um auditor de perfis em OTAs. Analise os materiais e crie um checklist de validação dos perfis do hotel em Booking.com, Expedia, Decolar e outras OTAs. Verifique: fotos, descrições, amenidades listadas, políticas, respostas a reviews. Liste o que está correto e o que precisa ser corrigido.', 'text'),
(7, 'Rate Parity', 'Você é um analista de paridade tarifária. Com base nos materiais, avalie a situação de rate parity do hotel. Identifique: disparidades encontradas entre canais, causas prováveis, impacto nas vendas diretas e recomendações para manter paridade ou usar disparidade estrategicamente.', 'text'),
(8, 'Google Meu Negócio', 'Você é um especialista em Google Business Profile para hotéis. Analise o perfil do hotel no Google e forneça recomendações para otimização: completude do perfil, fotos, posts, Q&A, reviews, atributos, categorias. Crie um plano de ação com prioridades.', 'text'),
(9, 'Recomendações de Ferramentas', 'Você é um consultor de tecnologia hoteleira. Com base no perfil e necessidades do hotel identificados nos materiais, recomende ferramentas e sistemas: motor de reservas, channel manager, RMS, CRM, chatbot, automação de marketing. Justifique cada recomendação e indique ordem de implementação.', 'text'),
(10, 'Cliente Oculto / Mystery Shopper', 'Você é um avaliador de experiência do cliente hoteleiro. Crie um roteiro de avaliação mystery shopper para o hotel cobrindo: processo de reserva online, atendimento telefônico, resposta a emails, experiência no site, comparação com concorrentes. Forneça critérios de avaliação e métricas sugeridas.', 'text');