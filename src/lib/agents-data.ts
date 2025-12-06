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
    title: "Comparativo de Concorrência",
    description: "Análise competitiva detalhada do mercado",
  },
  {
    id: 4,
    title: "SWOT Digital",
    description: "Forças, Fraquezas, Oportunidades e Ameaças",
  },
  {
    id: 5,
    title: "Distribuição e Canais de Vendas",
    description: "Análise da presença em canais de distribuição",
  },
  {
    id: 6,
    title: "Validação de Perfis nas OTAs",
    description: "Auditoria dos perfis em plataformas de reserva",
  },
  {
    id: 7,
    title: "Paridade Tarifária",
    description: "Análise de consistência de preços entre canais",
  },
  {
    id: 8,
    title: "Google Meu Negócio",
    description: "Otimização do perfil no Google",
  },
  {
    id: 9,
    title: "Recomendações de Ferramentas",
    description: "Recomendação de tecnologias hoteleiras",
  },
  {
    id: 10,
    title: "Cliente Oculto",
    description: "Avaliação da experiência de contato",
  },
];

export const getAgentById = (id: number): Agent | undefined => {
  return AGENTS.find(a => a.id === id);
};
