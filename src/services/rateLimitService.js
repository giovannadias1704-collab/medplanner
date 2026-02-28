// services/rateLimitService.js
import { db } from './firebase'; // ✅ usa seu firebase.js
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

// ─── Configuração ─────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;        // máximo de tentativas antes de bloquear
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos de bloqueio

// ─── Funções principais ───────────────────────────────────────────────────────

/**
 * Verifica se o email está bloqueado por excesso de tentativas
 * @param {string} email
 * @returns {Object} { blocked: boolean, remainingMs: number, attempts: number }
 */
export async function checkRateLimit(email) {
  try {
    const key = emailToKey(email);
    const ref = doc(db, 'rate_limits', key);
    const snap = await getDoc(ref);

    if (!snap.exists()) return { blocked: false, attempts: 0 };

    const data = snap.data();
    const now = Date.now();
    const blockedUntil = data.blockedUntil?.toMillis?.() || 0;

    // Ainda está dentro do período de bloqueio?
    if (data.blocked && blockedUntil > now) {
      return {
        blocked: true,
        remainingMs: blockedUntil - now,
        remainingMin: Math.ceil((blockedUntil - now) / 60000),
        attempts: data.attempts,
      };
    }

    // Bloqueio expirou — reseta automaticamente
    if (data.blocked && blockedUntil <= now) {
      await resetRateLimit(email);
      return { blocked: false, attempts: 0 };
    }

    return { blocked: false, attempts: data.attempts || 0 };
  } catch (error) {
    console.error('[RateLimit] Erro ao verificar:', error);
    return { blocked: false, attempts: 0 }; // em caso de erro, não bloqueia
  }
}

/**
 * Registra uma tentativa de login falha
 * @param {string} email
 * @returns {Object} { blocked: boolean, attempts: number, remainingMin?: number }
 */
export async function registerFailedAttempt(email) {
  try {
    const key = emailToKey(email);
    const ref = doc(db, 'rate_limits', key);
    const snap = await getDoc(ref);

    const currentAttempts = snap.exists() ? (snap.data().attempts || 0) : 0;
    const newAttempts = currentAttempts + 1;
    const shouldBlock = newAttempts >= MAX_ATTEMPTS;

    const payload = {
      email,
      attempts: newAttempts,
      blocked: shouldBlock,
      lastAttempt: serverTimestamp(),
      ...(shouldBlock && {
        blockedUntil: new Date(Date.now() + BLOCK_DURATION_MS),
      }),
    };

    await setDoc(ref, payload, { merge: true });

    if (shouldBlock) {
      console.warn(`[RateLimit] ${email} bloqueado após ${newAttempts} tentativas`);
      return { blocked: true, attempts: newAttempts, remainingMin: BLOCK_DURATION_MS / 60000 };
    }

    return { blocked: false, attempts: newAttempts, attemptsLeft: MAX_ATTEMPTS - newAttempts };
  } catch (error) {
    console.error('[RateLimit] Erro ao registrar tentativa:', error);
    return { blocked: false, attempts: 0 };
  }
}

/**
 * Reseta o contador após login bem-sucedido
 * @param {string} email
 */
export async function resetRateLimit(email) {
  try {
    const key = emailToKey(email);
    const ref = doc(db, 'rate_limits', key);
    await setDoc(ref, {
      email,
      attempts: 0,
      blocked: false,
      blockedUntil: null,
      lastSuccess: serverTimestamp(),
    });
  } catch (error) {
    console.error('[RateLimit] Erro ao resetar:', error);
  }
}

// ─── Utilitário ───────────────────────────────────────────────────────────────

// Transforma o email em uma chave segura para o Firestore (sem pontos ou @)
function emailToKey(email) {
  return email.toLowerCase().replace(/[@.]/g, '_');
}