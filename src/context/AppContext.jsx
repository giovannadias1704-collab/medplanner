import { createContext, useState, useEffect } from 'react';
import { auth, db, storage } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDocs,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // States
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [bills, setBills] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [weights, setWeights] = useState([]);
  const [waterLogs, setWaterLogs] = useState([]);
  const [notes, setNotes] = useState([]);
  const [pblCases, setPblCases] = useState([]);
  const [pblObjectives, setPblObjectives] = useState([]);
  const [pblReadings, setPblReadings] = useState([]);
  const [homeTasks, setHomeTasks] = useState([]);
  const [wellBeingEntries, setWellBeingEntries] = useState([]);
  
  // ========== NOVO: NOTIFICAÇÕES ==========
  const [notifications, setNotifications] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState('default');
  
  const [userProfile, setUserProfile] = useState({
    displayName: '',
    photoURL: '',
    email: ''
  });

  const [studyConfig, setStudyConfig] = useState({
    hoursPerDay: 4,
    subjectsPerDay: 3,
    preferredTime: 'morning',
    sessionType: 'pomodoro',
    configured: false
  });
  const [studySchedule, setStudySchedule] = useState([]);
  const [studyTopics, setStudyTopics] = useState([]);
  const [studyReviews, setStudyReviews] = useState([]);
  const [studyQuestions, setStudyQuestions] = useState([]);
  
  const [settings, setSettings] = useState({
    theme: 'light',
    aiAutoSave: false,
    weekStartsOn: 'monday',
    currency: 'BRL',
    waterGoal: 2.0,
    notifications: true,
    notificationTypes: {
      events: true,
      tasks: true,
      bills: true,
      water: true,
      study: true
    }
  });

  // Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ========== NOVO: VERIFICAR PERMISSÃO DE NOTIFICAÇÕES ==========
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Carregar dados do usuário
  useEffect(() => {
    if (!user) return;

    const unsubscribes = [];

    // Helper function to create listener
    const createListener = (collectionName, setState) => {
      const q = query(collection(db, 'users', user.uid, collectionName));
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setState(data);
      });
    };

    // Events
    unsubscribes.push(createListener('events', setEvents));
    
    // Tasks
    unsubscribes.push(createListener('tasks', setTasks));
    
    // Bills
    unsubscribes.push(createListener('bills', setBills));
    
    // Workouts
    unsubscribes.push(createListener('workouts', setWorkouts));
    
    // Meals
    unsubscribes.push(createListener('meals', setMeals));
    
    // Weights
    unsubscribes.push(createListener('weights', setWeights));
    
    // Water Logs
    unsubscribes.push(createListener('waterLogs', setWaterLogs));
    
    // Notes
    unsubscribes.push(createListener('notes', setNotes));
    
    // PBL Cases
    unsubscribes.push(createListener('pblCases', setPblCases));
    
    // PBL Objectives
    unsubscribes.push(createListener('pblObjectives', setPblObjectives));
    
    // PBL Readings
    unsubscribes.push(createListener('pblReadings', setPblReadings));

    // Home Tasks
    unsubscribes.push(createListener('homeTasks', setHomeTasks));

    // Well-Being Entries
    unsubscribes.push(createListener('wellBeingEntries', setWellBeingEntries));

    // Study Schedule
    unsubscribes.push(createListener('studySchedule', setStudySchedule));

    // Study Topics
    unsubscribes.push(createListener('studyTopics', setStudyTopics));

    // Study Reviews
    unsubscribes.push(createListener('studyReviews', setStudyReviews));

    // Study Questions
    unsubscribes.push(createListener('studyQuestions', setStudyQuestions));

    // ========== NOVO: NOTIFICATIONS ==========
    unsubscribes.push(createListener('notifications', setNotifications));

    // User Profile
    const userProfileQuery = query(collection(db, 'users', user.uid, 'profile'));
    unsubscribes.push(
      onSnapshot(userProfileQuery, (snapshot) => {
        if (!snapshot.empty) {
          setUserProfile(snapshot.docs[0].data());
        } else {
          setUserProfile({
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            email: user.email || ''
          });
        }
      })
    );

    // Study Config
    const studyConfigQuery = query(collection(db, 'users', user.uid, 'studyConfig'));
    unsubscribes.push(
      onSnapshot(studyConfigQuery, (snapshot) => {
        if (!snapshot.empty) {
          setStudyConfig(snapshot.docs[0].data());
        }
      })
    );

    // Settings
    const settingsQuery = query(collection(db, 'users', user.uid, 'settings'));
    unsubscribes.push(
      onSnapshot(settingsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const settingsData = snapshot.docs[0].data();
          setSettings(settingsData);
          
          // Aplicar tema imediatamente
          if (settingsData.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      })
    );

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  // ========== NOVO: SISTEMA DE VERIFICAÇÃO DE NOTIFICAÇÕES ==========
  useEffect(() => {
    if (!user || !settings.notifications) return;

    // Verificar a cada 5 minutos
    const checkInterval = setInterval(() => {
      checkForNotifications();
    }, 5 * 60 * 1000); // 5 minutos

    // Verificar imediatamente
    checkForNotifications();

    return () => clearInterval(checkInterval);
  }, [user, events, tasks, bills, settings]);

  // ========== NOVO: FUNÇÃO PARA VERIFICAR E CRIAR NOTIFICAÇÕES ==========
  const checkForNotifications = async () => {
    if (!user || !settings.notifications) return;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);
    const in3DaysStr = in3Days.toISOString().split('T')[0];

    // Eventos de amanhã
    if (settings.notificationTypes?.events) {
      for (const event of events) {
        if (event.date === tomorrowStr) {
          await createInAppNotification({
            type: 'event',
            title: '📅 Evento Amanhã',
            message: `${event.title} acontece amanhã!`,
            relatedId: event.id,
            priority: 'high'
          });
        }
      }
    }

    // Tarefas atrasadas
    if (settings.notificationTypes?.tasks) {
      const todayStr = now.toISOString().split('T')[0];
      for (const task of tasks) {
        if (!task.completed && task.date < todayStr) {
          await createInAppNotification({
            type: 'task',
            title: '⚠️ Tarefa Atrasada',
            message: `"${task.title}" está atrasada!`,
            relatedId: task.id,
            priority: 'high'
          });
        }
      }
    }

    // Contas a vencer em 3 dias
    if (settings.notificationTypes?.bills) {
      for (const bill of bills) {
        if (!bill.paid && bill.date <= in3DaysStr && bill.date >= tomorrowStr) {
          await createInAppNotification({
            type: 'bill',
            title: '💰 Conta a Vencer',
            message: `"${bill.title}" vence em breve! Valor: R$ ${bill.amount}`,
            relatedId: bill.id,
            priority: 'medium'
          });
        }
      }
    }

    // Lembrete de água (a cada 2 horas durante o dia)
    if (settings.notificationTypes?.water) {
      const hour = now.getHours();
      if (hour >= 8 && hour <= 20 && hour % 2 === 0) {
        const waterToday = getWaterIntakeToday();
        if (waterToday < settings.waterGoal) {
          await createInAppNotification({
            type: 'water',
            title: '💧 Hora de Beber Água',
            message: `Você já bebeu ${waterToday}L de ${settings.waterGoal}L hoje!`,
            priority: 'low',
            autoClose: true
          });
        }
      }
    }
  };

  // ========== NOVO: CRIAR NOTIFICAÇÃO IN-APP ==========
  const createInAppNotification = async (notificationData) => {
    if (!user) return;
    
    try {
      // Verificar se já existe notificação similar recente (últimas 24h)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const existingNotification = notifications.find(n => 
        n.type === notificationData.type &&
        n.relatedId === notificationData.relatedId &&
        new Date(n.createdAt) > oneDayAgo
      );

      if (existingNotification) return; // Não duplicar

      // Criar notificação no Firebase
      await addDoc(collection(db, 'users', user.uid, 'notifications'), {
        ...notificationData,
        read: false,
        createdAt: new Date().toISOString()
      });

      // Enviar notificação do navegador se permitido
      if (notificationPermission === 'granted') {
        sendBrowserNotification(notificationData.title, notificationData.message);
      }
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  };

  // ========== NOVO: ENVIAR NOTIFICAÇÃO DO NAVEGADOR ==========
  const sendBrowserNotification = (title, message, icon = '/icon-192.png') => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: icon,
          badge: '/icon-192.png',
          tag: `medplanner-${Date.now()}`,
          requireInteraction: false
        });
      } catch (error) {
        console.error('Erro ao enviar notificação do navegador:', error);
      }
    }
  };

  // ========== NOVO: SOLICITAR PERMISSÃO DE NOTIFICAÇÕES ==========
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações');
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return 'denied';
    }
  };

  // ========== NOVO: MARCAR NOTIFICAÇÃO COMO LIDA ==========
  const markNotificationAsRead = async (notificationId) => {
    if (!user) return;
    try {
      const notifRef = doc(db, 'users', user.uid, 'notifications', notificationId);
      
      // VERIFICAR SE DOCUMENTO EXISTE ANTES DE ATUALIZAR
      const notifDoc = await getDoc(notifRef);
      
      if (!notifDoc.exists()) {
        console.warn('⚠️ Notificação não encontrada no Firebase:', notificationId);
        // Remover do estado local se não existir no Firebase
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        return;
      }
      
      await updateDoc(notifRef, { read: true });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // ========== NOVO: MARCAR TODAS COMO LIDAS ==========
  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      for (const notification of unreadNotifications) {
        await markNotificationAsRead(notification.id);
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  // ========== NOVO: DELETAR NOTIFICAÇÃO ==========
  const deleteNotification = async (notificationId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notifications', notificationId));
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  // ========== NOVO: LIMPAR NOTIFICAÇÕES ANTIGAS (30+ dias) ==========
  const clearOldNotifications = async () => {
    if (!user) return;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const oldNotifications = notifications.filter(n => 
        new Date(n.createdAt) < thirtyDaysAgo
      );

      for (const notification of oldNotifications) {
        await deleteNotification(notification.id);
      }

      return oldNotifications.length;
    } catch (error) {
      console.error('Erro ao limpar notificações antigas:', error);
    }
  };

  // ========== NOVO: OBTER NOTIFICAÇÕES NÃO LIDAS ==========
  const getUnreadNotifications = () => {
    return notifications.filter(n => !n.read);
  };

  // ========== NOVO: CRIAR NOTIFICAÇÃO MANUAL ==========
  const addManualNotification = async (title, message, type = 'info', priority = 'medium') => {
    await createInAppNotification({
      type,
      title,
      message,
      priority,
      manual: true
    });
  };

  // ==================== EVENTS ====================
  const addEvent = async (eventData) => {
    if (!user) return;
    try {
      const eventRef = await addDoc(collection(db, 'users', user.uid, 'events'), {
        ...eventData,
        createdAt: new Date().toISOString()
      });

      // ========== NOVO: CRIAR NOTIFICAÇÃO PARA EVENTO ==========
      if (settings.notificationTypes?.events && eventData.date) {
        const eventDate = new Date(eventData.date);
        const now = new Date();
        const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

        if (daysUntil === 1) {
          await createInAppNotification({
            type: 'event',
            title: '📅 Evento Amanhã',
            message: `${eventData.title} acontece amanhã!`,
            relatedId: eventRef.id,
            priority: 'high'
          });
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
      throw error;
    }
  };

  const updateEvent = async (eventId, eventData) => {
    if (!user) return;
    try {
      const eventRef = doc(db, 'users', user.uid, 'events', eventId);
      await updateDoc(eventRef, eventData);
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  };

  const deleteEvent = async (eventId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'events', eventId));
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      throw error;
    }
  };

  // ==================== TASKS ====================
  const addTask = async (taskData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'tasks'), {
        ...taskData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      throw error;
    }
  };

  const updateTask = async (taskId, taskData) => {
    if (!user) return;
    try {
      const taskRef = doc(db, 'users', user.uid, 'tasks', taskId);
      await updateDoc(taskRef, taskData);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      throw error;
    }
  };

  const deleteTask = async (taskId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId));
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      throw error;
    }
  };

  // ==================== BILLS ====================
  const addBill = async (billData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'bills'), {
        ...billData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao adicionar conta:', error);
      throw error;
    }
  };

  const updateBill = async (billId, billData) => {
    if (!user) return;
    try {
      const billRef = doc(db, 'users', user.uid, 'bills', billId);
      await updateDoc(billRef, billData);
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      throw error;
    }
  };

  const deleteBill = async (billId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'bills', billId));
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      throw error;
    }
  };

  const toggleBillPaid = async (billId, currentPaidStatus) => {
    if (!user) return;
    try {
      const billRef = doc(db, 'users', user.uid, 'bills', billId);
      await updateDoc(billRef, { 
        paid: !currentPaidStatus,
        paidAt: !currentPaidStatus ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error('Erro ao marcar conta como paga:', error);
      throw error;
    }
  };

  // ==================== WORKOUTS ====================
  const addWorkout = async (workoutData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'workouts'), {
        ...workoutData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao adicionar treino:', error);
      throw error;
    }
  };

  const updateWorkout = async (workoutId, workoutData) => {
    if (!user) return;
    try {
      const workoutRef = doc(db, 'users', user.uid, 'workouts', workoutId);
      await updateDoc(workoutRef, workoutData);
    } catch (error) {
      console.error('Erro ao atualizar treino:', error);
      throw error;
    }
  };

  const deleteWorkout = async (workoutId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'workouts', workoutId));
    } catch (error) {
      console.error('Erro ao deletar treino:', error);
      throw error;
    }
  };

  // ==================== MEALS ====================
  const addMeal = async (mealData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'meals'), {
        ...mealData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao adicionar refeição:', error);
      throw error;
    }
  };

  const updateMeal = async (mealId, mealData) => {
    if (!user) return;
    try {
      const mealRef = doc(db, 'users', user.uid, 'meals', mealId);
      await updateDoc(mealRef, mealData);
    } catch (error) {
      console.error('Erro ao atualizar refeição:', error);
      throw error;
    }
  };

  const deleteMeal = async (mealId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'meals', mealId));
    } catch (error) {
      console.error('Erro ao deletar refeição:', error);
      throw error;
    }
  };

  // ==================== WEIGHT ====================
  const addWeight = async (weightData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'weights'), {
        ...weightData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao adicionar peso:', error);
      throw error;
    }
  };

  // ==================== WATER ====================
  const logWater = async (amount) => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, 'users', user.uid, 'waterLogs'), {
        amount,
        date: today,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao registrar água:', error);
      throw error;
    }
  };

  const getWaterIntakeToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = waterLogs.filter(log => log.date === today);
    return todayLogs.reduce((sum, log) => sum + log.amount, 0);
  };

  const updateWaterGoal = async (newGoal) => {
    if (!user) return;
    try {
      const settingsQuery = query(collection(db, 'users', user.uid, 'settings'));
      const snapshot = await getDocs(settingsQuery);
      
      if (!snapshot.empty) {
        const settingsRef = doc(db, 'users', user.uid, 'settings', snapshot.docs[0].id);
        await updateDoc(settingsRef, { waterGoal: newGoal });
      }
    } catch (error) {
      console.error('Erro ao atualizar meta de água:', error);
      throw error;
    }
  };

  // ==================== PBL ====================
  const addPBLCase = async (caseData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'pblCases'), {
        ...caseData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao adicionar caso PBL:', error);
      throw error;
    }
  };

  const updatePBLCase = async (caseId, caseData) => {
    if (!user) return;
    try {
      const caseRef = doc(db, 'users', user.uid, 'pblCases', caseId);
      await updateDoc(caseRef, caseData);
    } catch (error) {
      console.error('Erro ao atualizar caso PBL:', error);
      throw error;
    }
  };

  const deletePBLCase = async (caseId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'pblCases', caseId));
    } catch (error) {
      console.error('Erro ao deletar caso PBL:', error);
      throw error;
    }
  };

  const addPBLObjective = async (objectiveData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'pblObjectives'), {
        ...objectiveData,
        completed: false,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao adicionar objetivo PBL:', error);
      throw error;
    }
  };

  const togglePBLObjective = async (objectiveId, currentCompletedStatus) => {
    if (!user) return;
    try {
      const objectiveRef = doc(db, 'users', user.uid, 'pblObjectives', objectiveId);
      await updateDoc(objectiveRef, { 
        completed: !currentCompletedStatus,
        completedAt: !currentCompletedStatus ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error('Erro ao marcar objetivo como concluído:', error);
      throw error;
    }
  };

  const addPBLReading = async (readingData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'pblReadings'), {
        ...readingData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao adicionar leitura PBL:', error);
      throw error;
    }
  };

  const deletePBLReading = async (readingId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'pblReadings', readingId));
    } catch (error) {
      console.error('Erro ao deletar leitura PBL:', error);
      throw error;
    }
  };

  // ==================== HOME TASKS ====================
  const addHomeTask = async (taskData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'homeTasks'), {
        ...taskData,
        completed: false,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao adicionar tarefa doméstica:', error);
      throw error;
    }
  };

  const updateHomeTask = async (taskId, taskData) => {
    if (!user) return;
    try {
      const taskRef = doc(db, 'users', user.uid, 'homeTasks', taskId);
      await updateDoc(taskRef, taskData);
    } catch (error) {
      console.error('Erro ao atualizar tarefa doméstica:', error);
      throw error;
    }
  };

  const deleteHomeTask = async (taskId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'homeTasks', taskId));
    } catch (error) {
      console.error('Erro ao deletar tarefa doméstica:', error);
      throw error;
    }
  };

  const toggleHomeTask = async (taskId, currentCompletedStatus) => {
    if (!user) return;
    try {
      const taskRef = doc(db, 'users', user.uid, 'homeTasks', taskId);
      await updateDoc(taskRef, { 
        completed: !currentCompletedStatus,
        completedAt: !currentCompletedStatus ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error('Erro ao marcar tarefa como concluída:', error);
      throw error;
    }
  };

  // ==================== WELL-BEING ====================
  const addWellBeingEntry = async (entryData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'wellBeingEntries'), {
        ...entryData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao adicionar registro de bem-estar:', error);
      throw error;
    }
  };

  const getWellBeingHistory = () => {
    return wellBeingEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getWellBeingStats = (days = 7) => {
    const now = new Date();
    const startDate = new Date(now.setDate(now.getDate() - days));
    
    const recentEntries = wellBeingEntries.filter(entry => 
      new Date(entry.date) >= startDate
    );

    if (recentEntries.length === 0) {
      return {
        avgMood: 0,
        avgEnergy: 0,
        avgSleep: 0,
        totalEntries: 0,
        moodTrend: 'neutral',
        insights: []
      };
    }

    const avgMood = recentEntries.reduce((sum, e) => sum + (e.mood || 0), 0) / recentEntries.length;
    const avgEnergy = recentEntries.reduce((sum, e) => sum + (e.energy || 0), 0) / recentEntries.length;
    const avgSleep = recentEntries.reduce((sum, e) => sum + (parseFloat(e.sleep) || 0), 0) / recentEntries.length;

    const firstHalf = recentEntries.slice(Math.floor(recentEntries.length / 2));
    const secondHalf = recentEntries.slice(0, Math.floor(recentEntries.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, e) => sum + (e.mood || 0), 0) / (firstHalf.length || 1);
    const secondHalfAvg = secondHalf.reduce((sum, e) => sum + (e.mood || 0), 0) / (secondHalf.length || 1);
    
    let moodTrend = 'neutral';
    if (secondHalfAvg > firstHalfAvg + 0.3) moodTrend = 'improving';
    else if (secondHalfAvg < firstHalfAvg - 0.3) moodTrend = 'declining';

    const insights = [];
    
    if (avgMood >= 4) {
      insights.push('Seu humor está ótimo! Continue assim! 😊');
    } else if (avgMood <= 2.5) {
      insights.push('Seu humor está baixo. Considere atividades que te façam bem. 💙');
    }

    if (avgSleep < 6) {
      insights.push('Você está dormindo pouco. Tente priorizar 7-8h de sono. 😴');
    } else if (avgSleep >= 8) {
      insights.push('Ótima qualidade de sono! Continue mantendo essa rotina. ✨');
    }

    if (avgEnergy <= 2.5) {
      insights.push('Baixa energia detectada. Exercícios leves podem ajudar! ⚡');
    }

    return {
      avgMood: avgMood.toFixed(1),
      avgEnergy: avgEnergy.toFixed(1),
      avgSleep: avgSleep.toFixed(1),
      totalEntries: recentEntries.length,
      moodTrend,
      insights
    };
  };

  // ==================== USER PROFILE ====================
  const updateUserProfile = async (profileData) => {
    if (!user) return;
    try {
      const profileQuery = query(collection(db, 'users', user.uid, 'profile'));
      const snapshot = await getDocs(profileQuery);
      
      if (!snapshot.empty) {
        const profileRef = doc(db, 'users', user.uid, 'profile', snapshot.docs[0].id);
        await updateDoc(profileRef, profileData);
      } else {
        await addDoc(collection(db, 'users', user.uid, 'profile'), profileData);
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  const uploadProfilePhoto = async (file) => {
    if (!user) return;
    try {
      const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      await updateUserProfile({ photoURL });
      return photoURL;
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      throw error;
    }
  };

  // ==================== THEME ====================
  const updateTheme = async (newTheme) => {
    if (!user) return;
    try {
      const settingsQuery = query(collection(db, 'users', user.uid, 'settings'));
      const snapshot = await getDocs(settingsQuery);
      
      if (!snapshot.empty) {
        const settingsRef = doc(db, 'users', user.uid, 'settings', snapshot.docs[0].id);
        await updateDoc(settingsRef, { theme: newTheme });
      } else {
        await addDoc(collection(db, 'users', user.uid, 'settings'), { 
          ...settings, 
          theme: newTheme 
        });
      }
      
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Erro ao atualizar tema:', error);
      throw error;
    }
  };

  // ==================== SETTINGS ====================
  const updateSettings = async (newSettings) => {
    if (!user) return;
    try {
      const settingsQuery = query(collection(db, 'users', user.uid, 'settings'));
      const snapshot = await getDocs(settingsQuery);
      
      if (!snapshot.empty) {
        const settingsRef = doc(db, 'users', user.uid, 'settings', snapshot.docs[0].id);
        await updateDoc(settingsRef, newSettings);
      } else {
        await addDoc(collection(db, 'users', user.uid, 'settings'), newSettings);
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    }
  };

  // ==================== PDF PROCESSING ====================
  const processPDFWithAI = async (file) => {
    if (!user) return;
    try {
      const storageRef = ref(storage, `users/${user.uid}/temp/${file.name}`);
      await uploadBytes(storageRef, file);
      const pdfURL = await getDownloadURL(storageRef);
      
      return {
        success: true,
        events: [],
        message: 'PDF processado com sucesso!'
      };
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      throw error;
    }
  };

  // ==================== EXPORT DATA ====================
  const exportAllData = () => {
    const allData = {
      events,
      tasks,
      bills,
      workouts,
      meals,
      weights,
      waterLogs,
      pblCases,
      pblObjectives,
      pblReadings,
      homeTasks,
      wellBeingEntries,
      studySchedule,
      studyReviews,
      studyQuestions,
      settings,
      userProfile,
      notifications,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medplanner-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ==================== STUDY ====================
  const updateStudyConfig = async (configData) => {
    if (!user) return;
    try {
      const configQuery = query(collection(db, 'users', user.uid, 'studyConfig'));
      const snapshot = await getDocs(configQuery);
      
      if (!snapshot.empty) {
        const configRef = doc(db, 'users', user.uid, 'studyConfig', snapshot.docs[0].id);
        await updateDoc(configRef, { ...configData, configured: true });
      } else {
        await addDoc(collection(db, 'users', user.uid, 'studyConfig'), {
          ...configData,
          configured: true,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar configuração de estudo:', error);
      throw error;
    }
  };

  const generateStudySchedule = async () => {
    if (!user) return;
    try {
      const upcomingExams = events.filter(event => 
        event.type === 'exam' && new Date(event.date) > new Date()
      ).sort((a, b) => new Date(a.date) - new Date(b.date));

      if (upcomingExams.length === 0) {
        throw new Error('Nenhuma prova cadastrada no calendário');
      }

      const schedule = [];
      const today = new Date();
      
      for (const exam of upcomingExams) {
        const examDate = new Date(exam.date);
        const daysUntilExam = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExam <= 0) continue;
        
        const studyDays = Math.max(1, daysUntilExam - 1);
        const hoursPerDay = studyConfig.hoursPerDay || 4;
        const totalHours = studyDays * hoursPerDay;
        
        const topics = exam.topics || ['Revisar conteúdo geral'];
        const hoursPerTopic = totalHours / topics.length;
        
        let currentDate = new Date(today);
        let topicIndex = 0;
        let hoursAllocated = 0;
        
        for (let day = 0; day < studyDays; day++) {
          const currentTopic = topics[topicIndex % topics.length];
          
          schedule.push({
            date: new Date(currentDate).toISOString().split('T')[0],
            examId: exam.id,
            examTitle: exam.title,
            examDate: exam.date,
            topic: currentTopic,
            hours: hoursPerDay,
            completed: false,
            createdAt: new Date().toISOString()
          });
          
          hoursAllocated += hoursPerDay;
          
          if (hoursAllocated >= hoursPerTopic) {
            topicIndex++;
            hoursAllocated = 0;
          }
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        schedule.push({
          date: new Date(examDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          examId: exam.id,
          examTitle: exam.title,
          examDate: exam.date,
          topic: 'REVISÃO FINAL',
          hours: hoursPerDay,
          completed: false,
          isReview: true,
          createdAt: new Date().toISOString()
        });
      }
      
      const oldScheduleQuery = query(collection(db, 'users', user.uid, 'studySchedule'));
      const oldSchedule = await getDocs(oldScheduleQuery);
      for (const doc of oldSchedule.docs) {
        await deleteDoc(doc.ref);
      }
      
      for (const item of schedule) {
        await addDoc(collection(db, 'users', user.uid, 'studySchedule'), item);
      }
      
      return schedule;
    } catch (error) {
      console.error('Erro ao gerar cronograma:', error);
      throw error;
    }
  };

  const toggleStudyScheduleItem = async (scheduleId, currentStatus) => {
    if (!user) return;
    try {
      const scheduleRef = doc(db, 'users', user.uid, 'studySchedule', scheduleId);
      await updateDoc(scheduleRef, {
        completed: !currentStatus,
        completedAt: !currentStatus ? new Date().toISOString() : null
      });
      
      if (!currentStatus) {
        const scheduleItem = studySchedule.find(s => s.id === scheduleId);
        if (scheduleItem) {
          await createReviewSchedule(scheduleItem);
        }
      }
    } catch (error) {
      console.error('Erro ao marcar item do cronograma:', error);
      throw error;
    }
  };

  const createReviewSchedule = async (studyItem) => {
    if (!user) return;
    try {
      const studiedDate = new Date(studyItem.completedAt || new Date());
      const reviewIntervals = [1, 3, 7, 15, 30];
      
      for (const interval of reviewIntervals) {
        const reviewDate = new Date(studiedDate);
        reviewDate.setDate(reviewDate.getDate() + interval);
        
        await addDoc(collection(db, 'users', user.uid, 'studyReviews'), {
          topic: studyItem.topic,
          examTitle: studyItem.examTitle,
          examDate: studyItem.examDate,
          studiedDate: studyItem.completedAt || studyItem.date,
          reviewDate: reviewDate.toISOString().split('T')[0],
          interval: interval,
          completed: false,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Erro ao criar revisões:', error);
      throw error;
    }
  };

  const toggleReviewComplete = async (reviewId, currentStatus) => {
    if (!user) return;
    try {
      const reviewRef = doc(db, 'users', user.uid, 'studyReviews', reviewId);
      await updateDoc(reviewRef, {
        completed: !currentStatus,
        completedAt: !currentStatus ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error('Erro ao marcar revisão:', error);
      throw error;
    }
  };

  const addStudyTopic = async (topicData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'studyTopics'), {
        ...topicData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao adicionar tópico:', error);
      throw error;
    }
  };

  const addStudyQuestion = async (questionData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'studyQuestions'), {
        ...questionData,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao adicionar questão:', error);
      throw error;
    }
  };

  const answerStudyQuestion = async (questionId, isCorrect) => {
    if (!user) return;
    try {
      const questionRef = doc(db, 'users', user.uid, 'studyQuestions', questionId);
      const question = studyQuestions.find(q => q.id === questionId);
      
      await updateDoc(questionRef, {
        attempts: (question.attempts || 0) + 1,
        correct: (question.correct || 0) + (isCorrect ? 1 : 0),
        lastAttempt: new Date().toISOString(),
        lastResult: isCorrect
      });
    } catch (error) {
      console.error('Erro ao responder questão:', error);
      throw error;
    }
  };

  const getTodayReviews = () => {
    const today = new Date().toISOString().split('T')[0];
    return studyReviews.filter(review => 
      review.reviewDate === today && !review.completed
    );
  };

  const getUpcomingExams = () => {
    const today = new Date();
    return events
      .filter(event => event.type === 'exam' && new Date(event.date) > today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const value = {
    user,
    loading,
    // States
    events,
    tasks,
    bills,
    workouts,
    meals,
    weights,
    waterLogs,
    notes,
    pblCases,
    pblObjectives,
    pblReadings,
    homeTasks,
    wellBeingEntries,
    userProfile,
    studyConfig,
    studySchedule,
    studyTopics,
    studyReviews,
    studyQuestions,
    settings,
    // ========== NOVO: NOTIFICATIONS ==========
    notifications,
    notificationPermission,
    // Events
    addEvent,
    updateEvent,
    deleteEvent,
    // Tasks
    addTask,
    updateTask,
    deleteTask,
    // Bills
    addBill,
    updateBill,
    deleteBill,
    toggleBillPaid,
    // Workouts
    addWorkout,
    updateWorkout,
    deleteWorkout,
    // Meals
    addMeal,
    updateMeal,
    deleteMeal,
    // Weight
    addWeight,
    // Water
    logWater,
    getWaterIntakeToday,
    updateWaterGoal,
    // PBL
    addPBLCase,
    updatePBLCase,
    deletePBLCase,
    addPBLObjective,
    togglePBLObjective,
    addPBLReading,
    deletePBLReading,
    // Home Tasks
    addHomeTask,
    updateHomeTask,
    deleteHomeTask,
    toggleHomeTask,
    // Well-Being
    addWellBeingEntry,
    getWellBeingHistory,
    getWellBeingStats,
    // User Profile & Settings
    updateUserProfile,
    uploadProfilePhoto,
    updateTheme,
    updateSettings,
    processPDFWithAI,
    exportAllData,
    // Study
    updateStudyConfig,
    generateStudySchedule,
    toggleStudyScheduleItem,
    toggleReviewComplete,
    addStudyTopic,
    addStudyQuestion,
    answerStudyQuestion,
    getTodayReviews,
    getUpcomingExams,
    // ========== NOVO: NOTIFICATION FUNCTIONS ==========
    createInAppNotification,
    sendBrowserNotification,
    requestNotificationPermission,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearOldNotifications,
    getUnreadNotifications,
    addManualNotification,
    checkForNotifications
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}