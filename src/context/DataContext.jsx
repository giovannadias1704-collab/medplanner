import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { createDataListener } from '../utils/firebaseListeners';

const DataContext = createContext({});

const COLLECTIONS = [
  'eventos',
  'tarefas',
  'contas',
  'treinos',
  'refeicoes',
  'pesos',
  'agua',
  'notas',
  'pbl',
  'tarefasDomesticas',
  'bemEstar',
  'estudo'
];

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState({});
  const [error, setError] = useState(null);

  const loading = !user?.uid || Object.keys(data).length &lt; COLLECTIONS.length;

  useEffect(() => {
    if (!user?.uid) {
      setData({});
      setError(null);
      return;
    }

    const unsubscribes = [];

    COLLECTIONS.forEach((col) => {
      const callback = (items) => {
        const validatedItems = items.filter((item) => item.id && item.userId === user.uid);
        setData((prev) => ({ ...prev, [col]: validatedItems }));
      };

      const unsub = createDataListener(user.uid, col, callback);
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [user?.uid]);

  const validateData = useCallback((dataToValidate, collectionName) => {
    if (!dataToValidate || typeof dataToValidate !== 'object' || dataToValidate === null) {
      throw new Error('Dados inválidos');
    }
    switch (collectionName) {
      case 'tarefas':
      case 'eventos':
        if (!dataToValidate.title) throw new Error(`${collectionName} deve ter título`);
        break;
      case 'refeicoes':
        if (!dataToValidate.calories) throw new Error('Refeição deve ter calorias');
        break;
      default:
        break;
    }
  }, []);

  const addData = useCallback(async (collectionName, itemData) => {
    if (!COLLECTIONS.includes(collectionName)) {
      throw new Error('Coleção inválida');
    }
    validateData(itemData, collectionName);
    if (!user?.uid) {
      throw new Error('Usuário não logado');
    }
    setError(null);
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...itemData,
        userId: user.uid,
        createdAt: new Date(),
      });
      return docRef.id;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [user?.uid, validateData]);

  const updateData = useCallback(async (collectionName, id, updates) => {
    if (!COLLECTIONS.includes(collectionName)) {
      throw new Error('Coleção inválida');
    }
    validateData(updates, collectionName);
    if (!user?.uid) {
      throw new Error('Usuário não logado');
    }
    setError(null);
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [user?.uid, validateData]);

  const deleteData = useCallback(async (collectionName, id) => {
    if (!COLLECTIONS.includes(collectionName)) {
      throw new Error('Coleção inválida');
    }
    if (!user?.uid) {
      throw new Error('Usuário não logado');
    }
    setError(null);
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [user?.uid]);

  const value = {
    data,
    loading,
    error,
    addData,
    updateData,
    deleteData,
    validateData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
};