// 📁 components/CouponRequestForm.jsx
// Formulário para o usuário solicitar um cupom

"use client";

import { useState } from "react";
import { requestCoupon } from "@/services/couponService";
import { useAuth } from "@/hooks/useAuth"; // ajuste para seu hook de auth

export default function CouponRequestForm() {
  const { user } = useAuth(); // pega o usuário logado
  const [couponCode, setCouponCode] = useState("");
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      await requestCoupon({
        userEmail: user.email,
        userId: user.uid,
        couponCode: couponCode.trim(),
      });
      setStatus("success");
      setMessage("✅ Solicitação enviada! Aguarde a aprovação.");
      setCouponCode("");
    } catch (err) {
      setStatus("error");
      setMessage(`❌ ${err.message}`);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">Resgatar Cupom</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="Digite seu cupom (ex: VITALICIO)"
          className="border rounded-lg px-4 py-2 text-sm uppercase tracking-widest"
          disabled={status === "loading"}
        />

        <button
          type="submit"
          disabled={status === "loading" || !couponCode.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {status === "loading" ? "Enviando..." : "Solicitar Cupom"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-4 text-sm ${
            status === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}