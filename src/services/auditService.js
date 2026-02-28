import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export async function logAudit(action, details = {}) {
  try {
    const user = auth.currentUser;

    await addDoc(collection(db, 'audit_logs'), {
      uid: user?.uid || 'anonymous',
      email: user?.email || 'anonymous',
      action,
      details,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    });
  } catch (err) {
    console.error('Erro ao salvar log de auditoria:', err);
  }
}