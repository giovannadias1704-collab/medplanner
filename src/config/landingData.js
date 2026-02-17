// ========================================
// DADOS DA LANDING PAGE - MEDPLANNER
// ========================================
// 
// 📝 INSTRUÇÕES DE ATUALIZAÇÃO:
// 
// 1. STATS (Estatísticas):
//    - ATUALIZAR APÓS 8 MESES de uso real
//    - Buscar dados no Analytics/Firebase
//    - Substituir valores de exemplo pelos reais
// 
// 2. TESTIMONIALS (Depoimentos):
//    - IR ACRESCENTANDO conforme receber feedback real
//    - Pedir permissão ao aluno antes de publicar
//    - Manter máximo 6 depoimentos (os melhores)
// 
// 3. DATA DE CRIAÇÃO DO APP: Janeiro/2026
//    - Atualizar stats em: Setembro/2026
// 
// ========================================

export const landingData = {
  // ========== ESTATÍSTICAS ==========
  // 🔄 STATUS: DADOS DE EXEMPLO
  // 📅 ATUALIZAR EM: Setembro/2024 (8 meses após criação)
  // 📊 FONTE DOS DADOS REAIS: Firebase Analytics + Dashboard Admin
  
  stats: {
    studentsActive: {
      value: '500+',  // 🔄 EXEMPLO - Atualizar com Firebase Analytics
      label: 'Estudantes ativos',
      realDataSource: 'Firebase: Total de usuários com login nos últimos 30 dias'
    },
    satisfactionRate: {
      value: '95%',   // 🔄 EXEMPLO - Atualizar com pesquisa de satisfação
      label: 'Taxa de satisfação',
      realDataSource: 'Formulário de feedback in-app ou NPS'
    },
    timeSaved: {
      value: '10h',   // 🔄 EXEMPLO - Atualizar com Analytics de uso
      label: 'Economizadas/semana',
      realDataSource: 'Média de horas de uso do app vs tempo anterior relatado'
    },
    averageRating: {
      value: '4.9',   // 🔄 EXEMPLO - Atualizar com reviews reais
      label: 'Avaliação média',
      realDataSource: 'Média de avaliações na Play Store / App Store'
    }
  },

  // ========== DEPOIMENTOS ==========
  // 🔄 STATUS: DEPOIMENTOS FICTÍCIOS
  // 📅 IR SUBSTITUINDO conforme receber depoimentos REAIS
  // ⚠️ ATENÇÃO: Sempre pedir permissão ao aluno antes de publicar!
  // 
  // TEMPLATE PARA NOVOS DEPOIMENTOS:
  // {
  //   name: 'Nome Completo',
  //   course: 'Medicina - Xº ano',
  //   university: 'Nome da Universidade', // OPCIONAL
  //   text: 'Depoimento em aspas, máximo 200 caracteres',
  //   avatar: 'emoji apropriado',
  //   date: '2024-09-15', // Data do depoimento
  //   verified: true, // Sempre true para depoimentos reais
  //   permission: true // Confirmação de que o aluno autorizou
  // }

  testimonials: [
    // 🔄 EXEMPLO 1 - SUBSTITUIR POR REAL
    {
      name: 'Ana Silva',
      course: 'Medicina - 4º ano',
      university: '', // Adicionar quando real
      text: 'O MedPlanner transformou minha rotina! Consigo organizar tudo e ainda sobra tempo para cuidar da saúde.',
      avatar: '👩‍⚕️',
      isExample: true, // Remover quando substituir por real
      realDataNeeded: 'Solicitar depoimento de usuária ativa'
    },
    // 🔄 EXEMPLO 2 - SUBSTITUIR POR REAL
    {
      name: 'Carlos Santos',
      course: 'Medicina - 2º ano',
      university: '',
      text: 'Melhor investimento que fiz. A gestão de PBLs é incrível e me ajuda demais nas apresentações.',
      avatar: '👨‍⚕️',
      isExample: true,
      realDataNeeded: 'Solicitar depoimento de usuário ativo'
    },
    // 🔄 EXEMPLO 3 - SUBSTITUIR POR REAL
    {
      name: 'Marina Costa',
      course: 'Medicina - 5º ano',
      university: '',
      text: 'Uso todos os dias! O analytics me mostra exatamente onde preciso focar mais atenção nos estudos.',
      avatar: '👩‍🔬',
      isExample: true,
      realDataNeeded: 'Solicitar depoimento de usuária ativa'
    },
    
    // ========================================
    // ESPAÇO PARA DEPOIMENTOS REAIS
    // ========================================
    // Adicione novos depoimentos REAIS abaixo
    // Mantenha os exemplos acima até ter pelo menos 3 reais
    // Depois, remova os exemplos gradualmente
    
    // EXEMPLO DE DEPOIMENTO REAL:
    // {
    //   name: 'João Pedro Oliveira',
    //   course: 'Medicina - 3º ano',
    //   university: 'UFBA',
    //   text: 'Desde que comecei a usar o MedPlanner, minha organização melhorou 100%! Recomendo demais.',
    //   avatar: '👨‍⚕️',
    //   date: '2024-09-20',
    //   verified: true,
    //   permission: true
    // },
  ],

  // ========== BENEFÍCIOS ==========
  // ✅ Esses podem permanecer (são promessas/features)
  // Atualizar apenas se mudar funcionalidades
  
  benefits: [
    'Economize até 10 horas por semana na organização',
    'Nunca mais perca um prazo ou compromisso importante',
    'Acompanhe seu progresso acadêmico em tempo real',
    'Acesse de qualquer dispositivo - PWA instalável',
    'Sincronização automática na nuvem',
    'IA integrada para otimizar seus estudos',
  ],

  // ========== FEATURES ==========
  // ✅ Essas são permanentes (descrevem o produto)
  // Atualizar apenas se adicionar/remover features
  
  features: [
    {
      title: 'Calendário Inteligente',
      description: 'Organize suas aulas, plantões e estudos em um só lugar com lembretes automáticos.'
    },
    {
      title: 'Gestão de PBLs',
      description: 'Gerencie Problem-Based Learning com templates prontos e recursos colaborativos.'
    },
    {
      title: 'Analytics Completo',
      description: 'Acompanhe seu progresso com gráficos e relatórios detalhados de desempenho.'
    },
    {
      title: 'Saúde e Bem-estar',
      description: 'Monitore sono, exercícios e alimentação para manter o equilíbrio na rotina intensa.'
    },
  ]
};

// ========================================
// CHECKLIST DE ATUALIZAÇÃO (SETEMBRO/2026)
// ========================================
// 
// [ ] 1. Acessar Firebase Analytics
// [ ] 2. Extrair número real de usuários ativos (30 dias)
// [ ] 3. Calcular taxa de satisfação (NPS ou formulário)
// [ ] 4. Analisar tempo médio de uso
// [ ] 5. Coletar avaliações (se publicado em lojas)
// [ ] 6. Solicitar 3-6 depoimentos reais de usuários
// [ ] 7. Obter autorização escrita de cada depoente
// [ ] 8. Substituir dados de exemplo
// [ ] 9. Testar Landing Page atualizada
// [ ] 10. Fazer backup antes de publicar
// 
// ========================================