export interface Agent {
  id: number;
  title: string;
  description: string;
}

export const AGENTS: Agent[] = [
  {
    id: 0,
    title: "Apresentação do Hotel",
    description: "Análise completa da identidade e contexto estratégico do hotel",
  },
  {
    id: 1,
    title: "Persona / Estudo de Público-Alvo",
    description: "Definição detalhada do perfil do hóspede ideal",
  },
  {
    id: 2,
    title: "Reputação Online",
    description: "Análise de Google, TripAdvisor e OTAs",
  },
  {
    id: 3,
    title: "Comparativo com Concorrentes",
    description: "Análise competitiva detalhada do mercado",
  },
  {
    id: 4,
    title: "SWOT Digital",
    description: "Forças, Fraquezas, Oportunidades e Ameaças",
  },
  {
    id: 5,
    title: "Distribuição e Canais de Venda",
    description: "Análise da presença em canais de distribuição",
  },
  {
    id: 6,
    title: "Validação de Perfis em OTAs",
    description: "Auditoria dos perfis em plataformas de reserva",
  },
  {
    id: 7,
    title: "Rate Parity",
    description: "Análise de consistência de preços entre canais",
  },
  {
    id: 8,
    title: "Indicação das melhores ferramentas para o hotel, como motor de reservas, channel manager, PMS e RMS",
    description: "Recomendação de ferramentas tecnológicas essenciais para o hotel",
  },
  {
    id: 9,
    title: "Resumo Estratégico",
    description: "Consolidação de todos os insights em prioridades de ação",
  },
];

export const getAgentById = (id: number): Agent | undefined => {
  return AGENTS.find(a => a.id === id);
};
