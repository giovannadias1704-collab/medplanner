import { useState, useEffect } from 'react';
import { CheckCircleIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React from 'react';

const WHATSAPP_NUMBER = '5571992883976';

export default function Pricing() {
  // ===== AUTENTICAÇÃO E ROLE =====
  const { user, loading, role, roleLoading } = useAuth();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ===== CUPONS VÁLIDOS (OCULTOS) =====
  const validCoupons = {
    'MEDPLANNER30': { discount: 30, name: '30% OFF' },
    'MEDPLANNER50': { discount: 50, name: '50% OFF' },
    'MEDPLANNER100': { discount: 100, name: '100% OFF' }
  };

  // ===== APLICAR CUPOM =====
  const handleApplyCoupon = () => {
    if (!user) {
      setCouponError('Faça login primeiro');
      return;
    }

    const code = couponCode.toUpperCase().trim();
    if (!code) return setCouponError('Digite um código');
    if (!validCoupons[code]) return setCouponError('Cupom inválido');

    setAppliedCoupon({ code, ...validCoupons[code] });
    setCouponError('');
    alert(`✅ Cupom ${code} aplicado!\n\n${validCoupons[code].name}\n\nEscolha seu plano e finalize no WhatsApp.`);
  };

  // ===== PLANOS =====
  const plans = [
    {
      id: 'free',
      name: 'Grátis',
      price: 0,
      whatsappMessage: 'Quero começar o plano gratuito!',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 50,
      whatsappMessage: 'Quero assinar o plano Premium!',
    },
    {
      id: 'lifetime',
      name: 'Vitalício',
      price: 110,
      pixPrice: 480,
      lifetime: true,
      whatsappMessagePix: 'Quero pagar Vitalício via PIX!',
      whatsappMessageInstallment: 'Quero pagar Vitalício em 5x!',
    }
  ];

  // ===== CÁLCULO DE DESCONTO =====
  const calculateDiscount = (price) => appliedCoupon ? price * (1 - appliedCoupon.discount / 100) : price;

  const getPrice = (plan) => {
    if (plan.price === 0) return 'Grátis';

    if (plan.lifetime) {
      const pixPrice = calculateDiscount(plan.pixPrice);
      const installmentPrice = calculateDiscount(plan.price);

      return (
        <div>
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
            R$ {pixPrice.toFixed(2).replace('.', ',')}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">no PIX</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            ou 5x de R$ {(appliedCoupon && appliedCoupon.discount < 100 ? installmentPrice : plan.price) / 5}
          </div>
        </div>
      );
    }

    const finalPrice = calculateDiscount(plan.price);
    return `R$ ${finalPrice.toFixed(2).replace('.', ',')}`;
  };

  // ===== ASSINATURA =====
  const handleSubscribe = async (plan) => {
    if (plan.id === 'free') return alert('✅ Você já está usando o plano gratuito!');
    if (!user) return alert('⚠️ Faça login primeiro para assinar!');

    setIsProcessing(true);

    try {
      let message = '';
      let finalPrice = plan.price;

      // ===== PLANO VITALÍCIO =====
      if (plan.lifetime) {
        const choice = window.confirm('💎 PLANO VITALÍCIO:\n\nOK = R$ 480 PIX\nCancelar = 5x R$ 110');
        message = choice ? plan.whatsappMessagePix : plan.whatsappMessageInstallment;
        finalPrice = choice ? plan.pixPrice : plan.price;
      } else {
        message = plan.whatsappMessage;
      }

      // ===== CUPOM =====
      if (appliedCoupon) {
        const discount = appliedCoupon.discount;
        const discountedPrice = finalPrice * (1 - discount / 100);
        const token = crypto.randomUUID();

        const approveLink = `${window.location.origin}/approve-discount?token=${token}&action=approve`;
        const rejectLink = `${window.location.origin}/approve-discount?token=${token}&action=reject`;

        // Salvar solicitação no Firestore
        await setDoc(doc(db, 'couponRequests', token), {
          uid: user.uid,
          email: user.email,
          requestedPlanId: plan.id,
          requestedPlan: plan.name,
          requestedCoupon: appliedCoupon.code,
          requestedDiscount: discount,
          requestedPrice: discountedPrice,
          approvalStatus: 'waiting',
          createdAt: new Date()
        });

        await updateDoc(doc(db, 'users', user.uid), { subscriptionStatus: 'pending_approval' });

        // Gerar mensagem WhatsApp para aprovação
        message = `🎟️ NOVA SOLICITAÇÃO DE CUPOM
👤 ${user.email}
Plano: ${plan.name}
Cupom: ${appliedCoupon.code}
Desconto: ${discount}%
Valor final: R$ ${discountedPrice.toFixed(2)}
APROVAR:
${approveLink}
REJEITAR:
${rejectLink}`;

        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
        alert('✅ Solicitação enviada para aprovação!');
        return;
      }

      // ===== SEM CUPOM =====
      if (!message) return alert('Erro ao gerar mensagem.');
      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');

    } catch (error) {
      console.error(error);
      alert('Erro ao processar.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ===== LOADING =====
  if (loading || roleLoading) return <p>Carregando...</p>;

  // ===== RETORNO JSX =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 pb-32 p-4">
      
      <h1 className="text-2xl font-bold mb-4">Seja bem-vindo(a), {user?.email}</h1>

      {/* PAINEL ADMIN */}
      {role === 'admin' && (
        <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded mb-6">
          <h2 className="font-bold text-lg">Painel de Administração</h2>
          <p>Você pode gerenciar usuários, cupons e planos.</p>
        </div>
      )}

      {/* CAMPOS DE CUPOM */}
      <div className="mb-6">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          placeholder="Digite o cupom"
          className="border p-2 rounded mr-2"
        />
        <button onClick={handleApplyCoupon} className="bg-blue-500 text-white p-2 rounded">
          Aplicar
        </button>
        {couponError && <p className="text-red-500 mt-2">{couponError}</p>}
        {appliedCoupon && <p className="text-green-600 mt-2">Cupom {appliedCoupon.code} aplicado!</p>}
      </div>

      {/* PLANOS */}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="border p-4 rounded bg-white dark:bg-gray-800">
            <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
            <p className="mb-2">{getPrice(plan)}</p>
            <button
              onClick={() => handleSubscribe(plan)}
              disabled={isProcessing}
              className="bg-green-500 text-white p-2 rounded w-full"
            >
              {isProcessing ? 'Processando...' : 'Assinar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
