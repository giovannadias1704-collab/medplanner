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
import { generateText } from '../services/gemini';

export const AppContext = createContext();

// ─── Extrai texto do PDF usando pdf.js via CDN (sem instalar nada) ─────────────
async function extractTextFromPDF(file) {
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Falha ao carregar pdf.js'));
      document.head.appendChild(script);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map(item => item.str).join(' ') + '\n';
  }

  return fullText;
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState('default');

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
  const [studySessions, setStudySessions] = useState([]);
  const [weeklyEvaluations, setWeeklyEvaluations] = useState([]);
  
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

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = { uid: firebaseUser.uid, email: firebaseUser.email, ...userSnap.data() };
          setUser(userData);
          setIsAdmin(userSnap.data().role === "admin");
        } else {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribes = [];

    const createListener = (collectionName, setState) => {
      const q = query(collection(db, 'users', user.uid, collectionName));
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setState(data);
      });
    };

    unsubscribes.push(createListener('events', setEvents));
    unsubscribes.push(createListener('tasks', setTasks));
    unsubscribes.push(createListener('bills', setBills));
    unsubscribes.push(createListener('workouts', setWorkouts));
    unsubscribes.push(createListener('meals', setMeals));
    unsubscribes.push(createListener('weights', setWeights));
    unsubscribes.push(createListener('waterLogs', setWaterLogs));
    unsubscribes.push(createListener('notes', setNotes));
    unsubscribes.push(createListener('pblCases', setPblCases));
    unsubscribes.push(createListener('pblObjectives', setPblObjectives));
    unsubscribes.push(createListener('pblReadings', setPblReadings));
    unsubscribes.push(createListener('homeTasks', setHomeTasks));
    unsubscribes.push(createListener('wellBeingEntries', setWellBeingEntries));
    unsubscribes.push(createListener('studySchedule', setStudySchedule));
    unsubscribes.push(createListener('studyTopics', setStudyTopics));
    unsubscribes.push(createListener('studyReviews', setStudyReviews));
    unsubscribes.push(createListener('studyQuestions', setStudyQuestions));
    unsubscribes.push(createListener('studySessions', setStudySessions));
    unsubscribes.push(createListener('weeklyEvaluations', setWeeklyEvaluations));
    unsubscribes.push(createListener('notifications', setNotifications));

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

    const studyConfigQuery = query(collection(db, 'users', user.uid, 'studyConfig'));
    unsubscribes.push(
      onSnapshot(studyConfigQuery, (snapshot) => {
        if (!snapshot.empty) {
          setStudyConfig(snapshot.docs[0].data());
        }
      })
    );

    const settingsQuery = query(collection(db, 'users', user.uid, 'settings'));
    unsubscribes.push(
      onSnapshot(settingsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const settingsData = snapshot.docs[0].data();
          setSettings(settingsData);
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

  useEffect(() => {
    if (!user || !settings.notifications) return;
    const checkInterval = setInterval(() => {
      checkForNotifications();
    }, 5 * 60 * 1000);
    checkForNotifications();
    return () => clearInterval(checkInterval);
  }, [user, events, tasks, bills, settings]);

  // ==================== NOTIFICATIONS ====================
  const checkForNotifications = async () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);
    const in3DaysStr = in3Days.toISOString().split('T')[0];

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

  const createInAppNotification = async (notificationData) => {
    if (!user) return;
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const existingNotification = notifications.find(n => 
        n.type === notificationData.type &&
        n.relatedId === notificationData.relatedId &&
        new Date(n.createdAt) > oneDayAgo
      );
      if (existingNotification) return;

      await addDoc(collection(db, 'users', user.uid, 'notifications'), {
        ...notificationData,
        read: false,
        createdAt: new Date().toISOString()
      });

      if (notificationPermission === 'granted') {
        sendBrowserNotification(notificationData.title, notificationData.message);
      }
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
    }
  };

  const sendBrowserNotification = (title, message, icon = '/icon-192.png') => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon,
          badge: '/icon-192.png',
          tag: `medplanner-${Date.now()}`,
          requireInteraction: false
        });
      } catch (error) {
        console.error('Erro ao enviar notificação do navegador:', error);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return 'denied';
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    if (!user) return;
    try {
      const notifRef = doc(db, 'users', user.uid, 'notifications', notificationId);
      const notifDoc = await getDoc(notifRef);
      if (!notifDoc.exists()) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        return;
      }
      await updateDoc(notifRef, { read: true });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    try {
      for (const n of notifications.filter(n => !n.read)) {
        await markNotificationAsRead(n.id);
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notifications', notificationId));
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  const clearOldNotifications = async () => {
    if (!user) return;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const old = notifications.filter(n => new Date(n.createdAt) < thirtyDaysAgo);
      for (const n of old) await deleteNotification(n.id);
      return old.length;
    } catch (error) {
      console.error('Erro ao limpar notificações antigas:', error);
    }
  };

  const getUnreadNotifications = () => notifications.filter(n => !n.read);

  const addManualNotification = async (title, message, type = 'info', priority = 'medium') => {
    await createInAppNotification({ type, title, message, priority, manual: true });
  };

  // ==================== EVENTS ====================
  const addEvent = async (eventData) => {
    if (!user) return;
    try {
      const eventRef = await addDoc(collection(db, 'users', user.uid, 'events'), {
        ...eventData,
        createdAt: new Date().toISOString()
      });
      if (settings.notificationTypes?.events && eventData.date) {
        const daysUntil = Math.ceil((new Date(eventData.date) - new Date()) / (1000 * 60 * 60 * 24));
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
      await updateDoc(doc(db, 'users', user.uid, 'events', eventId), eventData);
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
      await addDoc(collection(db, 'users', user.uid, 'tasks'), { ...taskData, createdAt: new Date().toISOString() });
    } catch (error) { console.error('Erro ao adicionar tarefa:', error); throw error; }
  };

  const updateTask = async (taskId, taskData) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), taskData);
    } catch (error) { console.error('Erro ao atualizar tarefa:', error); throw error; }
  };

  const deleteTask = async (taskId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId));
    } catch (error) { console.error('Erro ao deletar tarefa:', error); throw error; }
  };

  // ==================== BILLS ====================
  const addBill = async (billData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'bills'), { ...billData, createdAt: new Date().toISOString() });
    } catch (error) { console.error('Erro ao adicionar conta:', error); throw error; }
  };

  const updateBill = async (billId, billData) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'bills', billId), billData);
    } catch (error) { console.error('Erro ao atualizar conta:', error); throw error; }
  };

  const deleteBill = async (billId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'bills', billId));
    } catch (error) { console.error('Erro ao deletar conta:', error); throw error; }
  };

  const toggleBillPaid = async (billId, currentPaidStatus) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'bills', billId), {
        paid: !currentPaidStatus,
        paidAt: !currentPaidStatus ? new Date().toISOString() : null
      });
    } catch (error) { console.error('Erro ao marcar conta como paga:', error); throw error; }
  };

  // ==================== WORKOUTS ====================
  const addWorkout = async (workoutData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'workouts'), { ...workoutData, createdAt: new Date().toISOString() });
    } catch (error) { console.error('Erro ao adicionar treino:', error); throw error; }
  };

  const updateWorkout = async (workoutId, workoutData) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'workouts', workoutId), workoutData);
    } catch (error) { console.error('Erro ao atualizar treino:', error); throw error; }
  };

  const deleteWorkout = async (workoutId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'workouts', workoutId));
    } catch (error) { console.error('Erro ao deletar treino:', error); throw error; }
  };

  // ==================== MEALS ====================
  const addMeal = async (mealData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'meals'), { ...mealData, createdAt: new Date().toISOString() });
    } catch (error) { console.error('Erro ao adicionar refeição:', error); throw error; }
  };

  const updateMeal = async (mealId, mealData) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'meals', mealId), mealData);
    } catch (error) { console.error('Erro ao atualizar refeição:', error); throw error; }
  };

  const deleteMeal = async (mealId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'meals', mealId));
    } catch (error) { console.error('Erro ao deletar refeição:', error); throw error; }
  };

  // ==================== WEIGHT ====================
  const addWeight = async (weightData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'weights'), { ...weightData, createdAt: new Date().toISOString() });
    } catch (error) { console.error('Erro ao adicionar peso:', error); throw error; }
  };

  // ==================== WATER ====================
  const logWater = async (amount) => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, 'users', user.uid, 'waterLogs'), {
        amount, date: today, createdAt: new Date().toISOString()
      });
    } catch (error) { console.error('Erro ao registrar água:', error); throw error; }
  };

  const getWaterIntakeToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return waterLogs.filter(log => log.date === today).reduce((sum, log) => sum + log.amount, 0);
  };

  const updateWaterGoal = async (newGoal) => {
    if (!user) return;
    try {
      const snapshot = await getDocs(query(collection(db, 'users', user.uid, 'settings')));
      if (!snapshot.empty) {
        await updateDoc(doc(db, 'users', user.uid, 'settings', snapshot.docs[0].id), { waterGoal: newGoal });
      }
    } catch (error) { console.error('Erro ao atualizar meta de água:', error); throw error; }
  };

  // ==================== PBL ====================
  const addPBLCase = async (caseData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'pblCases'), { ...caseData, createdAt: new Date().toISOString() });
    } catch (error) { console.error('Erro ao adicionar caso PBL:', error); throw error; }
  };

  const updatePBLCase = async (caseId, caseData) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'pblCases', caseId), caseData);
    } catch (error) { console.error('Erro ao atualizar caso PBL:', error); throw error; }
  };

  const deletePBLCase = async (caseId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'pblCases', caseId));
    } catch (error) { console.error('Erro ao deletar caso PBL:', error); throw error; }
  };

  const addPBLObjective = async (objectiveData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'pblObjectives'), {
        ...objectiveData, completed: false, createdAt: new Date().toISOString()
      });
    } catch (error) { console.error('Erro ao adicionar objetivo PBL:', error); throw error; }
  };

  const togglePBLObjective = async (objectiveId, currentCompletedStatus) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'pblObjectives', objectiveId), {
        completed: !currentCompletedStatus,
        completedAt: !currentCompletedStatus ? new Date().toISOString() : null
      });
    } catch (error) { console.error('Erro ao marcar objetivo como concluído:', error); throw error; }
  };

  const addPBLReading = async (readingData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'pblReadings'), { ...readingData, createdAt: new Date().toISOString() });
    } catch (error) { console.error('Erro ao adicionar leitura PBL:', error); throw error; }
  };

  const deletePBLReading = async (readingId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'pblReadings', readingId));
    } catch (error) { console.error('Erro ao deletar leitura PBL:', error); throw error; }
  };

  // ==================== HOME TASKS ====================
  const addHomeTask = async (taskData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'homeTasks'), {
        ...taskData, completed: false, createdAt: new Date().toISOString()
      });
    } catch (error) { console.error('Erro ao adicionar tarefa doméstica:', error); throw error; }
  };

  const updateHomeTask = async (taskId, taskData) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'homeTasks', taskId), taskData);
    } catch (error) { console.error('Erro ao atualizar tarefa doméstica:', error); throw error; }
  };

  const deleteHomeTask = async (taskId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'homeTasks', taskId));
    } catch (error) { console.error('Erro ao deletar tarefa doméstica:', error); throw error; }
  };

  const toggleHomeTask = async (taskId, currentCompletedStatus) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'homeTasks', taskId), {
        completed: !currentCompletedStatus,
        completedAt: !currentCompletedStatus ? new Date().toISOString() : null
      });
    } catch (error) { console.error('Erro ao marcar tarefa como concluída:', error); throw error; }
  };

  // ==================== WELL-BEING ====================
  const addWellBeingEntry = async (entryData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'wellBeingEntries'), { ...entryData, createdAt: new Date().toISOString() });
    } catch (error) { console.error('Erro ao adicionar registro de bem-estar:', error); throw error; }
  };

  const getWellBeingHistory = () => {
    return wellBeingEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getWellBeingStats = (days = 7) => {
    const now = new Date();
    const startDate = new Date(now.setDate(now.getDate() - days));
    const recentEntries = wellBeingEntries.filter(e => new Date(e.date) >= startDate);

    if (recentEntries.length === 0) {
      return { avgMood: 0, avgEnergy: 0, avgSleep: 0, totalEntries: 0, moodTrend: 'neutral', insights: [] };
    }

    const avgMood = recentEntries.reduce((s, e) => s + (e.mood || 0), 0) / recentEntries.length;
    const avgEnergy = recentEntries.reduce((s, e) => s + (e.energy || 0), 0) / recentEntries.length;
    const avgSleep = recentEntries.reduce((s, e) => s + (parseFloat(e.sleep) || 0), 0) / recentEntries.length;

    const half = Math.floor(recentEntries.length / 2);
    const firstHalfAvg = recentEntries.slice(half).reduce((s, e) => s + (e.mood || 0), 0) / (half || 1);
    const secondHalfAvg = recentEntries.slice(0, half).reduce((s, e) => s + (e.mood || 0), 0) / (half || 1);
    
    let moodTrend = 'neutral';
    if (secondHalfAvg > firstHalfAvg + 0.3) moodTrend = 'improving';
    else if (secondHalfAvg < firstHalfAvg - 0.3) moodTrend = 'declining';

    const insights = [];
    if (avgMood >= 4) insights.push('Seu humor está ótimo! Continue assim! 😊');
    else if (avgMood <= 2.5) insights.push('Seu humor está baixo. Considere atividades que te façam bem. 💙');
    if (avgSleep < 6) insights.push('Você está dormindo pouco. Tente priorizar 7-8h de sono. 😴');
    else if (avgSleep >= 8) insights.push('Ótima qualidade de sono! Continue mantendo essa rotina. ✨');
    if (avgEnergy <= 2.5) insights.push('Baixa energia detectada. Exercícios leves podem ajudar! ⚡');

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
      const snapshot = await getDocs(query(collection(db, 'users', user.uid, 'profile')));
      if (!snapshot.empty) {
        await updateDoc(doc(db, 'users', user.uid, 'profile', snapshot.docs[0].id), profileData);
      } else {
        await addDoc(collection(db, 'users', user.uid, 'profile'), profileData);
      }
    } catch (error) { console.error('Erro ao atualizar perfil:', error); throw error; }
  };

  const uploadProfilePhoto = async (file) => {
    if (!user) return;
    try {
      const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      await updateUserProfile({ photoURL });
      return photoURL;
    } catch (error) { console.error('Erro ao fazer upload da foto:', error); throw error; }
  };

  // ==================== THEME ====================
  const updateTheme = async (newTheme) => {
    if (!user) return;
    try {
      const snapshot = await getDocs(query(collection(db, 'users', user.uid, 'settings')));
      if (!snapshot.empty) {
        await updateDoc(doc(db, 'users', user.uid, 'settings', snapshot.docs[0].id), { theme: newTheme });
      } else {
        await addDoc(collection(db, 'users', user.uid, 'settings'), { ...settings, theme: newTheme });
      }
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) { console.error('Erro ao atualizar tema:', error); throw error; }
  };

  // ==================== SETTINGS ====================
  const updateSettings = async (newSettings) => {
    if (!user) return;
    try {
      const snapshot = await getDocs(query(collection(db, 'users', user.uid, 'settings')));
      if (!snapshot.empty) {
        await updateDoc(doc(db, 'users', user.uid, 'settings', snapshot.docs[0].id), newSettings);
      } else {
        await addDoc(collection(db, 'users', user.uid, 'settings'), newSettings);
      }
    } catch (error) { console.error('Erro ao atualizar configurações:', error); throw error; }
  };

  // ==================== PDF PROCESSING (IMPLEMENTADO) ====================
  const processPDFWithAI = async (file) => {
    if (!user) return;

    // 1. Extrai texto do PDF via pdf.js (CDN, sem instalar nada)
    const pdfText = await extractTextFromPDF(file);

    if (!pdfText || pdfText.trim().length < 20) {
      throw new Error('Não foi possível extrair texto do PDF. O arquivo pode ser uma imagem escaneada.');
    }

    // 2. Envia para o Gemini identificar eventos
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();

    const prompt = `Você é um assistente que extrai eventos de textos acadêmicos/universitários.

TEXTO DO PDF:
"${pdfText.substring(0, 8000)}"

Analise o texto e extraia TODOS os eventos, provas, aulas, prazos e compromissos que encontrar.

IMPORTANTE: Retorne APENAS um array JSON válido, sem texto adicional, sem markdown.

FORMATO EXATO:
[
  {
    "title": "Prova de Anatomia",
    "date": "2025-06-15",
    "time": "08:00",
    "type": "exam",
    "description": "Prova bimestral - capítulos 1 a 5",
    "color": "#EF4444"
  }
]

REGRAS:
- date: formato YYYY-MM-DD obrigatório (use ${currentYear} como ano base se não estiver explícito)
- time: formato HH:MM (use "00:00" se não informado)
- type: "exam" para provas, "class" para aulas, "deadline" para prazos, "event" para outros
- color: "#EF4444" para provas, "#3B82F6" para aulas, "#F59E0B" para prazos, "#8B5CF6" para eventos
- title: máximo 60 caracteres
- Ignore eventos antes de ${today}
- Se não encontrar nenhum evento claro, retorne []

Retorne SOMENTE o array JSON.`;

    const result = await generateText(prompt);

    // 3. Parseia a resposta
    const start = result.indexOf('[');
    const end = result.lastIndexOf(']');
    if (start === -1 || end === -1) {
      return { success: true, events: [], savedCount: 0 };
    }

    let extractedEvents = [];
    try {
      extractedEvents = JSON.parse(result.substring(start, end + 1));
    } catch {
      return { success: true, events: [], savedCount: 0 };
    }

    if (!Array.isArray(extractedEvents) || extractedEvents.length === 0) {
      return { success: true, events: [], savedCount: 0 };
    }

    // 4. Salva eventos no Firebase
    let savedCount = 0;
    for (const event of extractedEvents) {
      if (!event.title || !event.date) continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date)) continue;

      await addDoc(collection(db, 'users', user.uid, 'events'), {
        title: event.title,
        date: event.date,
        time: event.time || '00:00',
        type: event.type || 'event',
        description: event.description || `Importado do PDF: ${file.name}`,
        color: event.color || '#8B5CF6',
        importedFromPDF: true,
        pdfName: file.name,
        createdAt: new Date().toISOString()
      });

      savedCount++;
    }

    return { success: true, events: extractedEvents, savedCount };
  };

  // ==================== EXPORT DATA ====================
  const exportAllData = () => {
    const allData = {
      events, tasks, bills, workouts, meals, weights, waterLogs,
      pblCases, pblObjectives, pblReadings, homeTasks, wellBeingEntries,
      studySchedule, studyReviews, studyQuestions, studySessions,
      weeklyEvaluations, settings, userProfile, notifications,
      exportedAt: new Date().toISOString()
    };
    const dataStr = JSON.stringify(allData, null, 2);
    const url = URL.createObjectURL(new Blob([dataStr], { type: 'application/json' }));
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
      const snapshot = await getDocs(query(collection(db, 'users', user.uid, 'studyConfig')));
      if (!snapshot.empty) {
        await updateDoc(doc(db, 'users', user.uid, 'studyConfig', snapshot.docs[0].id), { ...configData, configured: true });
      } else {
        await addDoc(collection(db, 'users', user.uid, 'studyConfig'), {
          ...configData, configured: true, createdAt: new Date().toISOString()
        });
      }
    } catch (error) { console.error('Erro ao atualizar configuração de estudo:', error); throw error; }
  };

  const generateStudySchedule = async () => {
    if (!user) return;
    try {
      const upcomingExams = events
        .filter(e => e.type === 'exam' && new Date(e.date) > new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (upcomingExams.length === 0) throw new Error('Nenhuma prova cadastrada no calendário');

      const schedule = [];
      const today = new Date();
      
      for (const exam of upcomingExams) {
        const examDate = new Date(exam.date);
        const daysUntilExam = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
        if (daysUntilExam <= 0) continue;

        const studyDays = Math.max(1, daysUntilExam - 1);
        const hoursPerDay = studyConfig.hoursPerDay || 4;
        const topics = exam.topics || ['Revisar conteúdo geral'];
        const hoursPerTopic = (studyDays * hoursPerDay) / topics.length;

        let currentDate = new Date(today);
        let topicIndex = 0;
        let hoursAllocated = 0;

        for (let day = 0; day < studyDays; day++) {
          schedule.push({
            date: new Date(currentDate).toISOString().split('T')[0],
            examId: exam.id, examTitle: exam.title, examDate: exam.date,
            topic: topics[topicIndex % topics.length],
            hours: hoursPerDay, completed: false, createdAt: new Date().toISOString()
          });
          hoursAllocated += hoursPerDay;
          if (hoursAllocated >= hoursPerTopic) { topicIndex++; hoursAllocated = 0; }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        schedule.push({
          date: new Date(examDate.getTime() - 86400000).toISOString().split('T')[0],
          examId: exam.id, examTitle: exam.title, examDate: exam.date,
          topic: 'REVISÃO FINAL', hours: hoursPerDay,
          completed: false, isReview: true, createdAt: new Date().toISOString()
        });
      }

      const oldDocs = await getDocs(query(collection(db, 'users', user.uid, 'studySchedule')));
      for (const d of oldDocs.docs) await deleteDoc(d.ref);
      for (const item of schedule) {
        await addDoc(collection(db, 'users', user.uid, 'studySchedule'), item);
      }

      return schedule;
    } catch (error) { console.error('Erro ao gerar cronograma:', error); throw error; }
  };

  const toggleStudyScheduleItem = async (scheduleId, currentStatus) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'studySchedule', scheduleId), {
        completed: !currentStatus,
        completedAt: !currentStatus ? new Date().toISOString() : null
      });
      if (!currentStatus) {
        const item = studySchedule.find(s => s.id === scheduleId);
        if (item) await createReviewSchedule(item);
      }
    } catch (error) { console.error('Erro ao marcar item do cronograma:', error); throw error; }
  };

  const createReviewSchedule = async (studyItem) => {
    if (!user) return;
    try {
      const studiedDate = new Date(studyItem.completedAt || new Date());
      for (const interval of [1, 3, 7, 15, 30]) {
        const reviewDate = new Date(studiedDate);
        reviewDate.setDate(reviewDate.getDate() + interval);
        await addDoc(collection(db, 'users', user.uid, 'studyReviews'), {
          topic: studyItem.topic, examTitle: studyItem.examTitle, examDate: studyItem.examDate,
          studiedDate: studyItem.completedAt || studyItem.date,
          reviewDate: reviewDate.toISOString().split('T')[0],
          interval, completed: false, createdAt: new Date().toISOString()
        });
      }
    } catch (error) { console.error('Erro ao criar revisões:', error); throw error; }
  };

  const toggleReviewComplete = async (reviewId, currentStatus) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'studyReviews', reviewId), {
        completed: !currentStatus,
        completedAt: !currentStatus ? new Date().toISOString() : null
      });
    } catch (error) { console.error('Erro ao marcar revisão:', error); throw error; }
  };

  const addStudyTopic = async (topicData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'studyTopics'), { ...topicData, createdAt: new Date().toISOString() });
    } catch (error) { console.error('Erro ao adicionar tópico:', error); throw error; }
  };

  const addStudyQuestion = async (questionData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'studyQuestions'), { ...questionData, createdAt: new Date().toISOString() });
    } catch (error) { console.error('Erro ao adicionar questão:', error); throw error; }
  };

  const updateStudyQuestion = async (questionId, questionData) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'studyQuestions', questionId), questionData);
    } catch (error) { console.error('Erro ao atualizar questão:', error); throw error; }
  };

  const deleteStudyQuestion = async (questionId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'studyQuestions', questionId));
    } catch (error) { console.error('Erro ao deletar questão:', error); throw error; }
  };

  const updateStudyReview = async (reviewId, reviewData) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'studyReviews', reviewId), reviewData);
    } catch (error) { console.error('Erro ao atualizar revisão:', error); throw error; }
  };

  const deleteStudyReview = async (reviewId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'studyReviews', reviewId));
    } catch (error) { console.error('Erro ao deletar revisão:', error); throw error; }
  };

  const addStudySession = async (sessionData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'studySessions'), { ...sessionData, createdAt: new Date().toISOString() });
    } catch (error) { console.error('Erro ao adicionar sessão de estudo:', error); throw error; }
  };

  const addWeeklyEvaluation = async (evaluationData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'weeklyEvaluations'), { ...evaluationData, createdAt: new Date().toISOString() });
    } catch (error) { console.error('Erro ao adicionar avaliação semanal:', error); throw error; }
  };

  const answerStudyQuestion = async (questionId, isCorrect) => {
    if (!user) return;
    try {
      const question = studyQuestions.find(q => q.id === questionId);
      await updateDoc(doc(db, 'users', user.uid, 'studyQuestions', questionId), {
        attempts: (question.attempts || 0) + 1,
        correct: (question.correct || 0) + (isCorrect ? 1 : 0),
        lastAttempt: new Date().toISOString(),
        lastResult: isCorrect
      });
    } catch (error) { console.error('Erro ao responder questão:', error); throw error; }
  };

  const getTodayReviews = () => {
    const today = new Date().toISOString().split('T')[0];
    return studyReviews.filter(r => r.reviewDate === today && !r.completed);
  };

  const getUpcomingExams = () => {
    const today = new Date();
    return events
      .filter(e => e.type === 'exam' && new Date(e.date) > today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const value = {
    user, loading, isAdmin, events, tasks, bills, workouts, meals, weights,
    waterLogs, notes, pblCases, pblObjectives, pblReadings, homeTasks,
    wellBeingEntries, userProfile, studyConfig, studySchedule, studyTopics,
    studyReviews, studyQuestions, studySessions, weeklyEvaluations,
    settings, notifications, notificationPermission,
    addEvent, updateEvent, deleteEvent,
    addTask, updateTask, deleteTask,
    addBill, updateBill, deleteBill, toggleBillPaid,
    addWorkout, updateWorkout, deleteWorkout,
    addMeal, updateMeal, deleteMeal,
    addWeight, logWater, getWaterIntakeToday, updateWaterGoal,
    addPBLCase, updatePBLCase, deletePBLCase,
    addPBLObjective, togglePBLObjective,
    addPBLReading, deletePBLReading,
    addHomeTask, updateHomeTask, deleteHomeTask, toggleHomeTask,
    addWellBeingEntry, getWellBeingHistory, getWellBeingStats,
    updateUserProfile, uploadProfilePhoto,
    updateTheme, updateSettings,
    processPDFWithAI, exportAllData,
    updateStudyConfig, generateStudySchedule, toggleStudyScheduleItem,
    toggleReviewComplete, addStudyTopic, addStudyQuestion, updateStudyQuestion,
    deleteStudyQuestion, addStudySession, addWeeklyEvaluation,
    updateStudyReview, deleteStudyReview, answerStudyQuestion,
    getTodayReviews, getUpcomingExams,
    createInAppNotification, sendBrowserNotification, requestNotificationPermission,
    markNotificationAsRead, markAllNotificationsAsRead, deleteNotification,
    clearOldNotifications, getUnreadNotifications, addManualNotification,
    checkForNotifications
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}