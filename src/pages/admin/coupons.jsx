// 📁 app/admin/coupons/page.jsx  (ou pages/admin/coupons.jsx)
// Painel admin para aprovar/rejeitar solicitações de cupom

"use client";

import { useEffect, useState } from "react";
import {
  getAllCouponRequests,
  approveCouponRequest,
  rejectCouponRequest,
} from "@/services/couponService";

const STATUS_LABEL = {
  pending: { text: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  approved: { text: "Aprovado", color: "bg-green-100 text-green-800" },
  rejected: { text: "Rejeitado", color: "bg-red-100 text-red-800" },
};

export default function AdminCouponsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadRequests() {
    setLoading(true);
    const data = await getAllCouponRequests();
    // Ordena: pendentes primeiro
    data.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return 0;
    });
    setRequests(data);
    setLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleApprove(id) {
    await approveCouponRequest(id);
    await loadRequests();
  }

  async function handleReject(id) {
    await rejectCouponRequest(id);
    await loadRequests();
  }

  if (loading) return <p className="p-8">Carregando solicitações...</p>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Solicitações de Cupom</h1>

      {requests.length === 0 && (
        <p className="text-gray-500">Nenhuma solicitação ainda.</p>
      )}

      <div className="flex flex-col gap-4">
        {requests.map((req) => {
          const badge = STATUS_LABEL[req.status];
          return (
            <div
              key={req.id}
              className="border rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1">
                <p className="font-semibold">{req.userEmail}</p>
                <p className="text-sm text-gray-500">
                  Cupom:{" "}
                  <span className="font-mono font-bold">{req.couponCode}</span>{" "}
                  → Plano: <span className="font-bold">{req.targetPlan}</span>
                </p>
                <p className="text-xs text-gray-400">
                  Solicitado em:{" "}
                  {req.createdAt?.toDate?.()?.toLocaleDateString("pt-BR") ??
                    "—"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${badge.color}`}
                >
                  {badge.text}
                </span>

                {req.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="bg-green-600 text-white text-sm px-3 py-1 rounded-lg hover:bg-green-700"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="bg-red-500 text-white text-sm px-3 py-1 rounded-lg hover:bg-red-600"
                    >
                      Rejeitar
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}