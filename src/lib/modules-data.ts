export interface ModuleChecklistItem {
  id: string;
  label: string;
}

export interface ModuleQuestion {
  id: string;
  question: string;
  placeholder?: string;
}

export interface Module {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  instructions: string;
  checklist: ModuleChecklistItem[];
  questions: ModuleQuestion[];
  clientSummaryLabel: string;
}

export const MODULES: Module[] = [
  {
    id: 0,
    title: "Apresentação do Hotel",
    description: "Análise completa da identidade e contexto estratégico do hotel",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    instructions: "Realize uma análise detalhada do hotel, incluindo sua presença digital, localização estratégica e posicionamento no mercado. Este módulo é fundamental para entender o contexto do cliente.",
    checklist: [
      { id: "site", label: "Site oficial verificado e analisado" },
      { id: "localizacao", label: "Localização e acessibilidade mapeadas" },
      { id: "fotos", label: "Qualidade das fotos avaliada" },
      { id: "canais", label: "Canais de venda listados" },
      { id: "tipo", label: "Tipo de hospedagem identificado" },
    ],
    questions: [
      { id: "proposito", question: "Qual é o propósito principal do hotel?", placeholder: "Descreva a missão e visão do estabelecimento..." },
      { id: "publico", question: "Quem é o público principal?", placeholder: "Identifique o perfil predominante de hóspedes..." },
      { id: "pontos_fortes", question: "Quais são os pontos fortes do hotel?", placeholder: "Liste os diferenciais competitivos..." },
      { id: "limitantes", question: "Quais são os fatores limitantes?", placeholder: "Identifique desafios e restrições..." },
    ],
    clientSummaryLabel: "Identidade e contexto estratégico do hotel",
  },
  {
    id: 1,
    title: "Persona (Estudo de Público-Alvo)",
    description: "Definição detalhada do perfil do hóspede ideal",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    instructions: "Desenvolva um perfil completo da persona do hotel, identificando origem, motivações, comportamento de compra e gatilhos emocionais que influenciam a decisão de reserva.",
    checklist: [
      { id: "origem", label: "Origem geográfica dos hóspedes mapeada" },
      { id: "proposito_viagem", label: "Propósito da viagem identificado" },
      { id: "faixa_preco", label: "Faixa de preço analisada" },
      { id: "perfil", label: "Perfil do viajante definido" },
    ],
    questions: [
      { id: "emocao", question: "Qual emoção motiva a escolha deste hotel?", placeholder: "Descreva o estado emocional do hóspede ao escolher..." },
      { id: "gatilhos", question: "Quais são os principais gatilhos de venda?", placeholder: "Liste os elementos que mais influenciam a decisão..." },
      { id: "objecoes", question: "Quais objeções o hóspede pode ter?", placeholder: "Identifique possíveis barreiras à conversão..." },
    ],
    clientSummaryLabel: "Descrição clara da persona do hotel",
  },
  {
    id: 2,
    title: "Reputação Online",
    description: "Análise de Google, TripAdvisor e OTAs",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    instructions: "Realize um diagnóstico completo da reputação online do hotel em todas as plataformas relevantes. Identifique tendências, padrões de feedback e oportunidades de melhoria.",
    checklist: [
      { id: "notas", label: "Notas em todas as plataformas verificadas" },
      { id: "volume", label: "Volume de avaliações analisado" },
      { id: "elogios", label: "Principais elogios identificados" },
      { id: "reclamacoes", label: "Principais reclamações mapeadas" },
    ],
    questions: [
      { id: "tendencias", question: "Quais tendências você identificou nas avaliações?", placeholder: "Descreva padrões recorrentes nos feedbacks..." },
      { id: "riscos", question: "Quais riscos a reputação apresenta?", placeholder: "Identifique vulnerabilidades..." },
      { id: "oportunidades", question: "Quais oportunidades de melhoria existem?", placeholder: "Sugira ações de melhoria..." },
    ],
    clientSummaryLabel: "Diagnóstico e impacto da reputação online",
  },
  {
    id: 3,
    title: "Comparativo de Concorrência",
    description: "Análise competitiva detalhada do mercado",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    instructions: "Compare o hotel com seus principais concorrentes em termos de preço, qualidade de conteúdo, diferenciais e reputação. Identifique gaps e oportunidades de posicionamento.",
    checklist: [
      { id: "precos", label: "Preços dos concorrentes comparados" },
      { id: "fotos_conc", label: "Qualidade das fotos analisada" },
      { id: "conteudo", label: "Conteúdo e copy avaliados" },
      { id: "diferenciais", label: "Diferenciais mapeados" },
      { id: "reputacao_conc", label: "Reputação dos concorrentes verificada" },
    ],
    questions: [
      { id: "vantagem", question: "Qual é a principal vantagem competitiva?", placeholder: "Identifique o diferencial mais forte..." },
      { id: "gaps", question: "Quais gaps existem em relação à concorrência?", placeholder: "Liste pontos onde o hotel está atrás..." },
      { id: "oportunidades_conc", question: "Quais oportunidades o mercado oferece?", placeholder: "Descreva espaços não explorados..." },
    ],
    clientSummaryLabel: "Mapa de vantagem competitiva",
  },
  {
    id: 4,
    title: "SWOT Digital",
    description: "Forças, Fraquezas, Oportunidades e Ameaças",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    instructions: "Construa uma análise SWOT focada no ambiente digital do hotel. Use os insights dos módulos anteriores para fundamentar cada quadrante.",
    checklist: [
      { id: "forcas", label: "Forças digitais identificadas" },
      { id: "fraquezas", label: "Fraquezas digitais mapeadas" },
      { id: "oportunidades_swot", label: "Oportunidades de mercado listadas" },
      { id: "ameacas", label: "Ameaças competitivas identificadas" },
    ],
    questions: [
      { id: "recomendacoes", question: "Quais são as recomendações estratégicas de posicionamento?", placeholder: "Baseado na SWOT, sugira direcionamentos..." },
      { id: "prioridades", question: "Quais ações devem ser priorizadas?", placeholder: "Ordene as iniciativas por impacto..." },
    ],
    clientSummaryLabel: "Análise SWOT e recomendações estratégicas",
  },
  {
    id: 5,
    title: "Distribuição e Canais de Vendas",
    description: "Análise da presença em canais de distribuição",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    instructions: "Mapeie todos os canais de venda onde o hotel está presente, avalie a performance estimada de cada um e identifique oportunidades de expansão ou otimização.",
    checklist: [
      { id: "canais_atuais", label: "Canais atuais listados" },
      { id: "canais_potenciais", label: "Canais potenciais identificados" },
      { id: "performance", label: "Performance estimada por canal" },
    ],
    questions: [
      { id: "dependencia", question: "Quais são os riscos de dependência de canal?", placeholder: "Avalie a concentração em determinados canais..." },
      { id: "expansao", question: "Quais oportunidades de expansão existem?", placeholder: "Sugira novos canais estratégicos..." },
    ],
    clientSummaryLabel: "Estratégia de distribuição e canais",
  },
  {
    id: 6,
    title: "Validação de Perfis nas OTAs",
    description: "Auditoria dos perfis em plataformas de reserva",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    instructions: "Realize uma auditoria completa dos perfis do hotel nas principais OTAs. Verifique consistência de informações, qualidade de fotos, copy e configurações de tarifas.",
    checklist: [
      { id: "fotos_ota", label: "Qualidade das fotos verificada" },
      { id: "descricoes", label: "Descrições e copy analisadas" },
      { id: "tarifas", label: "Configuração de tarifas validada" },
      { id: "reputacao_ota", label: "Gestão de reputação avaliada" },
      { id: "consistencia", label: "Consistência entre plataformas verificada" },
    ],
    questions: [
      { id: "gaps_ota", question: "Quais gaps foram identificados nos perfis?", placeholder: "Liste inconsistências e problemas encontrados..." },
      { id: "correcoes", question: "Quais correções imediatas são necessárias?", placeholder: "Priorize as ações de melhoria..." },
    ],
    clientSummaryLabel: "Diagnóstico e ações para perfis OTA",
  },
  {
    id: 7,
    title: "Paridade Tarifária",
    description: "Análise de consistência de preços entre canais",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    instructions: "Compare os preços praticados no site oficial com as OTAs. Identifique disparidades e calcule o impacto financeiro da falta de paridade.",
    checklist: [
      { id: "comparacao_site", label: "Preços do site oficial coletados" },
      { id: "comparacao_otas", label: "Preços das OTAs coletados" },
      { id: "disparidades", label: "Disparidades identificadas" },
    ],
    questions: [
      { id: "impacto", question: "Qual é o impacto financeiro estimado da disparidade?", placeholder: "Calcule perdas potenciais..." },
      { id: "estrategia_preco", question: "Qual estratégia de precificação é recomendada?", placeholder: "Sugira ajustes de política tarifária..." },
    ],
    clientSummaryLabel: "Análise de paridade e impacto financeiro",
  },
  {
    id: 8,
    title: "Google Meu Negócio",
    description: "Otimização do perfil no Google",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    instructions: "Avalie o perfil do hotel no Google Meu Negócio. Verifique completude das informações, qualidade das fotos, frequência de posts e gestão de perguntas e respostas.",
    checklist: [
      { id: "info_completas", label: "Informações completas e atualizadas" },
      { id: "fotos_gmb", label: "Fotos de qualidade publicadas" },
      { id: "posts", label: "Posts e atualizações verificados" },
      { id: "perguntas", label: "Gestão de perguntas avaliada" },
      { id: "cta", label: "Call-to-action configurado" },
    ],
    questions: [
      { id: "conversao", question: "Qual é o nível atual de conversão do perfil?", placeholder: "Avalie efetividade do perfil..." },
      { id: "potencial", question: "Qual é o potencial de melhoria?", placeholder: "Identifique oportunidades de otimização..." },
    ],
    clientSummaryLabel: "Diagnóstico e otimização do Google Meu Negócio",
  },
  {
    id: 9,
    title: "Indicação de Ferramentas",
    description: "Recomendação de tecnologias hoteleiras",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    instructions: "Avalie a maturidade tecnológica do hotel e recomende ferramentas adequadas para motor de reservas, channel manager, PMS e RMS.",
    checklist: [
      { id: "motor", label: "Necessidade de motor de reservas avaliada" },
      { id: "channel", label: "Necessidade de channel manager avaliada" },
      { id: "pms", label: "Situação do PMS verificada" },
      { id: "rms", label: "Necessidade de RMS analisada" },
    ],
    questions: [
      { id: "maturidade", question: "Qual é o nível de maturidade tecnológica do hotel?", placeholder: "Avalie a infraestrutura atual..." },
      { id: "necessidades", question: "Quais ferramentas são prioritárias?", placeholder: "Ordene por impacto e urgência..." },
    ],
    clientSummaryLabel: "Recomendação de stack tecnológico",
  },
  {
    id: 10,
    title: "Cliente Oculto",
    description: "Avaliação da experiência de contato",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    instructions: "Realize uma análise de cliente oculto, testando os canais de contato do hotel. Avalie clareza das informações, tempo de resposta e potencial de conversão.",
    checklist: [
      { id: "experiencia", label: "Experiência de contato testada" },
      { id: "clareza", label: "Clareza das informações avaliada" },
      { id: "tempo_resposta", label: "Tempo de resposta medido" },
      { id: "conversao_co", label: "Potencial de conversão analisado" },
    ],
    questions: [
      { id: "oportunidades_co", question: "Quais oportunidades imediatas foram identificadas?", placeholder: "Liste melhorias de alto impacto..." },
      { id: "experiencia_geral", question: "Como foi a experiência geral do contato?", placeholder: "Descreva pontos positivos e negativos..." },
    ],
    clientSummaryLabel: "Relatório de cliente oculto e recomendações",
  },
];

export const getModuleById = (id: number): Module | undefined => {
  return MODULES.find(m => m.id === id);
};
