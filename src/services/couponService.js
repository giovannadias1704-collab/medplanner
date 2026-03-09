// 📁 services/couponService.js
// Cole este arquivo na pasta services/ do seu projeto Next.js

import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

const COLLECTION = "couponRequests";

// ✅ Usuário solicita um cupom
export async function requestCoupon({ userEmail, userId, couponCode }) {
  // Verifica se o cupom é válido
  const validCoupons = {
    VITALICIO: { targetPlan: "lifetime", planPrice: 0, finalPrice: 0 },
    // adicione mais cupons aqui se precisar
  };

  const coupon = validCoupons[couponCode.toUpperCase()];
  if (!coupon) throw new Error("Cupom inválido");

  // Verifica se o usuário já pediu este cupom
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
    where("couponCode", "==", couponCode.toUpperCase())
  );
  const existing = await getDocs(q);
  if (!existing.empty) throw new Error("Você já solicitou este cupom");

  // Cria o documento
  const docRef = await addDoc(collection(db, COLLECTION), {
    userEmail,
    userId,
    couponCode: couponCode.toUpperCase(),
    status: "pending",
    targetPlan: coupon.targetPlan,
    planPrice: coupon.planPrice,
    finalPrice: coupon.finalPrice,
    createdAt: serverTimestamp(),
    approvedAt: null,
  });

  return docRef.id;
}

// ✅ Admin: buscar todas as solicitações
export async function getAllCouponRequests() {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// ✅ Admin: aprovar solicitação
export async function approveCouponRequest(requestId) {
  await updateDoc(doc(db, COLLECTION, requestId), {
    status: "approved",
    approvedAt: serverTimestamp(),
  });
}

// ✅ Admin: rejeitar solicitação
export async function rejectCouponRequest(requestId) {
  await updateDoc(doc(db, COLLECTION, requestId), {
    status: "rejected",
    approvedAt: null,
  });
}