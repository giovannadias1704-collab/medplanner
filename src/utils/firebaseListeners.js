import { db } from '../firebase/config';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

/**
 * Factory para criar listeners reutilizáveis no Firestore.
 * @param {string} userId - ID do usuário
 * @param {string} collectionName - Nome da coleção
 * @param {function(Array<Object>): void} callback - Callback com os dados
 * @returns {function(): void} Função para cancelar o listener
 */
export const createDataListener = (userId, collectionName, callback) => {
  if (!userId || !collectionName || typeof callback !== 'function') {
    throw new Error('Parâmetros inválidos para createDataListener');
  }

  const q = query(
    collection(db, collectionName),
    where('userId', '==', userId)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(items);
    },
    (err) => {
      console.error(`Erro no listener para ${collectionName}:`, err);
      callback([]);
    }
  );

  return unsubscribe;
};