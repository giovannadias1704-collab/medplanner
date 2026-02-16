/**
 * Calculadora de Estatísticas - MedPlanner
 */

// ========== ESTATÍSTICAS DE ESTUDOS ==========
export const calculateStudyStats = (studySchedule, studyReviews, events) => {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentStudies = studySchedule.filter(s => 
    new Date(s.date) >= sevenDaysAgo && new Date(s.date) <= today
  );

  const completedStudies = recentStudies.filter(s => s.completed);
  const totalHours = completedStudies.reduce((sum, s) => sum + (s.hours || 0), 0);
  const completionRate = recentStudies.length > 0 
    ? (completedStudies.length / recentStudies.length) * 100 
    : 0;

  const upcomingExams = events.filter(e => 
    e.type === 'exam' && new Date(e.date) > today
  ).sort((a, b) => new Date(a.date) - new Date(b.date));

  const nextExam = upcomingExams[0];
  const daysUntilExam = nextExam 
    ? Math.ceil((new Date(nextExam.date) - today) / (1000 * 60 * 60 * 24))
    : null;

  const pendingReviews = studyReviews.filter(r => 
    !r.completed && new Date(r.reviewDate) <= today
  ).length;

  const insights = [];
  
  if (completionRate >= 80) {
    insights.push('Excelente! Você está cumprindo seu cronograma de estudos! 🎯');
  } else if (completionRate < 50) {
    insights.push('Você está ficando para trás no cronograma. Tente dedicar mais tempo aos estudos. 📚');
  }

  if (totalHours < 10) {
    insights.push('Tente aumentar suas horas de estudo esta semana. Meta recomendada: 20-25h/semana. ⏰');
  } else if (totalHours >= 25) {
    insights.push('Ótima dedicação! Você está estudando bastante. Lembre-se de descansar também! 🌟');
  }

  if (pendingReviews > 0) {
    insights.push(`Você tem ${pendingReviews} revisão(ões) pendente(s). Revisar é essencial para fixar conteúdo! 🔄`);
  }

  if (daysUntilExam && daysUntilExam <= 7) {
    insights.push(`Sua próxima prova (${nextExam.title}) é em ${daysUntilExam} dia(s). Foco total! 🎓`);
  }

  return {
    totalHours,
    completionRate: completionRate.toFixed(0),
    completedStudies: completedStudies.length,
    totalScheduled: recentStudies.length,
    nextExam: nextExam?.title || 'Nenhuma prova agendada',
    daysUntilExam,
    pendingReviews,
    insights
  };
};

// ========== ESTATÍSTICAS DE SAÚDE ==========
export const calculateHealthStats = (waterLogs, workouts, weights, settings) => {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const todayStr = today.toISOString().split('T')[0];

  // Água
  const recentWaterLogs = waterLogs.filter(w => 
    new Date(w.date) >= sevenDaysAgo
  );

  const waterToday = waterLogs
    .filter(w => w.date === todayStr)
    .reduce((sum, w) => sum + w.amount, 0);

  const avgWaterPerDay = recentWaterLogs.length > 0
    ? recentWaterLogs.reduce((sum, w) => sum + w.amount, 0) / 7
    : 0;

  const waterGoalPercentage = settings?.waterGoal 
    ? (waterToday / settings.waterGoal) * 100 
    : 0;

  // Exercícios
  const recentWorkouts = workouts.filter(w => 
    new Date(w.date) >= sevenDaysAgo && new Date(w.date) <= today
  );

  const workoutsThisWeek = recentWorkouts.length;
  const totalWorkoutMinutes = recentWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);

  // Peso
  const recentWeights = weights
    .filter(w => new Date(w.date) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const currentWeight = recentWeights[0]?.weight || null;
  const previousWeight = recentWeights[recentWeights.length - 1]?.weight || null;
  const weightChange = currentWeight && previousWeight 
    ? (currentWeight - previousWeight).toFixed(1)
    : null;

  const insights = [];

  if (waterGoalPercentage >= 100) {
    insights.push('Parabéns! Você atingiu sua meta de hidratação hoje! 💧');
  } else if (waterGoalPercentage < 50) {
    insights.push('Beba mais água! Você está abaixo de 50% da meta diária. 🥤');
  }

  if (workoutsThisWeek === 0) {
    insights.push('Você não se exercitou esta semana. Que tal uma caminhada leve? 🚶‍♀️');
  } else if (workoutsThisWeek >= 5) {
    insights.push('Incrível! Você está muito ativo(a) esta semana! Continue assim! 💪');
  } else if (workoutsThisWeek >= 3) {
    insights.push('Ótima frequência de exercícios! Você está no caminho certo! ✨');
  }

  if (weightChange && Math.abs(weightChange) > 0.5) {
    if (weightChange > 0) {
      insights.push(`Você ganhou ${weightChange}kg esta semana. Acompanhe sua alimentação. ⚖️`);
    } else {
      insights.push(`Você perdeu ${Math.abs(weightChange)}kg esta semana. Continue focado(a)! 🎯`);
    }
  }

  return {
    waterToday: waterToday.toFixed(1),
    waterGoal: settings?.waterGoal || 2.0,
    waterGoalPercentage: waterGoalPercentage.toFixed(0),
    avgWaterPerDay: avgWaterPerDay.toFixed(1),
    workoutsThisWeek,
    totalWorkoutMinutes,
    avgWorkoutDuration: workoutsThisWeek > 0 ? (totalWorkoutMinutes / workoutsThisWeek).toFixed(0) : 0,
    currentWeight,
    weightChange,
    insights
  };
};

// ========== ESTATÍSTICAS DE FINANÇAS ==========
export const calculateFinanceStats = (bills) => {
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  const billsThisMonth = bills.filter(b => {
    const billDate = new Date(b.date);
    return billDate.getMonth() === thisMonth && billDate.getFullYear() === thisYear;
  });

  const totalBills = billsThisMonth.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
  const paidBills = billsThisMonth.filter(b => b.paid);
  const totalPaid = paidBills.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
  const totalPending = totalBills - totalPaid;

  const overdueBills = billsThisMonth.filter(b => 
    !b.paid && new Date(b.date) < today
  );

  const upcomingBills = billsThisMonth.filter(b => {
    const billDate = new Date(b.date);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return !b.paid && billDate >= today && billDate <= threeDaysFromNow;
  });

  const insights = [];

  if (overdueBills.length > 0) {
    insights.push(`⚠️ Você tem ${overdueBills.length} conta(s) atrasada(s)! Priorize o pagamento.`);
  }

  if (upcomingBills.length > 0) {
    const totalUpcoming = upcomingBills.reduce((sum, b) => sum + parseFloat(b.amount), 0);
    insights.push(`📅 ${upcomingBills.length} conta(s) vencendo nos próximos 3 dias. Total: R$ ${totalUpcoming.toFixed(2)}`);
  }

  const paymentRate = billsThisMonth.length > 0 
    ? (paidBills.length / billsThisMonth.length) * 100 
    : 0;

  if (paymentRate === 100) {
    insights.push('🎉 Parabéns! Todas as contas do mês estão pagas!');
  } else if (paymentRate >= 80) {
    insights.push('✅ Você está em dia com suas contas! Continue assim!');
  } else if (paymentRate < 50) {
    insights.push('💰 Menos de 50% das contas foram pagas. Organize suas finanças!');
  }

  return {
    totalBills: totalBills.toFixed(2),
    totalPaid: totalPaid.toFixed(2),
    totalPending: totalPending.toFixed(2),
    billsCount: billsThisMonth.length,
    paidCount: paidBills.length,
    pendingCount: billsThisMonth.length - paidBills.length,
    overdueCount: overdueBills.length,
    upcomingCount: upcomingBills.length,
    paymentRate: paymentRate.toFixed(0),
    insights
  };
};

// ========== ESTATÍSTICAS DE TAREFAS ==========
export const calculateTaskStats = (tasks, homeTasks) => {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const allTasks = [...tasks, ...homeTasks];

  const recentTasks = allTasks.filter(t => 
    new Date(t.createdAt) >= sevenDaysAgo
  );

  const completedTasks = allTasks.filter(t => t.completed);
  const overdueTasks = allTasks.filter(t => 
    !t.completed && t.date && new Date(t.date) < today
  );

  const todayTasks = allTasks.filter(t => {
    if (!t.date) return false;
    const taskDate = new Date(t.date).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    return taskDate === todayStr && !t.completed;
  });

  const completionRate = allTasks.length > 0
    ? (completedTasks.length / allTasks.length) * 100
    : 0;

  const insights = [];

  if (overdueTasks.length > 0) {
    insights.push(`⚠️ Você tem ${overdueTasks.length} tarefa(s) atrasada(s). Priorize-as!`);
  }

  if (todayTasks.length > 0) {
    insights.push(`📋 ${todayTasks.length} tarefa(s) para completar hoje!`);
  }

  if (completionRate >= 80) {
    insights.push('🎯 Excelente taxa de conclusão! Você está arrasando!');
  } else if (completionRate < 50) {
    insights.push('📌 Menos de 50% das tarefas foram concluídas. Foque nas prioridades!');
  }

  if (recentTasks.length > 20) {
    insights.push('📝 Você criou muitas tarefas recentemente. Considere consolidá-las!');
  }

  return {
    totalTasks: allTasks.length,
    completedTasks: completedTasks.length,
    pendingTasks: allTasks.length - completedTasks.length,
    overdueTasks: overdueTasks.length,
    todayTasks: todayTasks.length,
    completionRate: completionRate.toFixed(0),
    recentTasksCount: recentTasks.length,
    insights
  };
};

// ========== ESTATÍSTICAS GERAIS DO DASHBOARD ==========
export const calculateDashboardStats = (
  events,
  tasks,
  homeTasks,
  bills,
  studySchedule,
  waterLogs,
  settings
) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Eventos hoje
  const eventsToday = events.filter(e => e.date === todayStr).length;

  // Tarefas pendentes hoje
  const allTasks = [...tasks, ...homeTasks];
  const tasksToday = allTasks.filter(t => 
    t.date === todayStr && !t.completed
  ).length;

  // Contas vencendo esta semana
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const billsThisWeek = bills.filter(b => {
    const billDate = new Date(b.date);
    return !b.paid && billDate >= today && billDate <= nextWeek;
  }).length;

  // Água hoje
  const waterToday = waterLogs
    .filter(w => w.date === todayStr)
    .reduce((sum, w) => sum + w.amount, 0);
  
  const waterGoalPercentage = settings?.waterGoal 
    ? (waterToday / settings.waterGoal) * 100 
    : 0;

  // Estudos hoje
  const studiesToday = studySchedule.filter(s => 
    s.date === todayStr && !s.completed
  ).length;

  return {
    eventsToday,
    tasksToday,
    billsThisWeek,
    waterToday: waterToday.toFixed(1),
    waterGoal: settings?.waterGoal || 2.0,
    waterGoalPercentage: waterGoalPercentage.toFixed(0),
    studiesToday
  };
};

// ========== COMPARAÇÃO SEMANAL ==========
export const calculateWeeklyComparison = (data, dateField = 'date') => {
  const today = new Date();
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const thisWeekData = data.filter(item => {
    const itemDate = new Date(item[dateField]);
    return itemDate >= thisWeekStart && itemDate <= today;
  });

  const lastWeekData = data.filter(item => {
    const itemDate = new Date(item[dateField]);
    return itemDate >= lastWeekStart && itemDate < thisWeekStart;
  });

  const thisWeekCount = thisWeekData.length;
  const lastWeekCount = lastWeekData.length;

  const difference = thisWeekCount - lastWeekCount;
  const percentageChange = lastWeekCount > 0 
    ? ((difference / lastWeekCount) * 100).toFixed(0)
    : 0;

  return {
    thisWeek: thisWeekCount,
    lastWeek: lastWeekCount,
    difference,
    percentageChange,
    trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'stable'
  };
};