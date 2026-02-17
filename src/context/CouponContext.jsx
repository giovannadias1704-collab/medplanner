import { createContext, useState, useContext } from 'react';

export const CouponContext = createContext();

export function CouponProvider({ children }) {
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // SEU NÚMERO DE WHATSAPP (formato: 5571992883976)
  const ADMIN_WHATSAPP = '5571992883976';

  const validCoupons = {
    'MEDPLANNER30': {
      code: 'MEDPLANNER30',
      discount: 0.30,
      label: '30% OFF'
    },
    'MEDPLANNER50': {
      code: 'MEDPLANNER50',
      discount: 0.50,
      label: '50% OFF'
    },
    'MEDPLANNER100': {
      code: 'MEDPLANNER100',
      discount: 1.0,
      label: '100% OFF - GRÁTIS'
    }
  };

  const applyCoupon = async (code, planName, planPrice, userEmail) => {
    const coupon = validCoupons[code];

    if (!coupon) {
      return {
        success: false,
        message: '❌ Cupom inválido!'
      };
    }

    setAppliedCoupon(coupon);

    // CALCULAR VALORES
    const discountAmount = (planPrice * coupon.discount).toFixed(2);
    const finalPrice = (planPrice * (1 - coupon.discount)).toFixed(2);

    // MENSAGEM PARA WHATSAPP
    const message = `🎟️ *NOVO CUPOM APLICADO - MEDPLANNER*

👤 *Usuário:* ${userEmail || 'Não informado'}
📦 *Plano:* ${planName}
🎫 *Cupom:* ${code} (${coupon.label})

💰 *Valores:*
• Preço original: R$ ${planPrice.toFixed(2).replace('.', ',')}
• Desconto: -R$ ${discountAmount.replace('.', ',')}
• Preço final: R$ ${finalPrice.replace('.', ',')}

⏰ *Data/Hora:* ${new Date().toLocaleString('pt-BR')}

---
📌 *Ação necessária:* Aprovar ou recusar este cupom`;

    // ABRIR WHATSAPP COM MENSAGEM PRÉ-PREENCHIDA
    const whatsappURL = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
    
    // ABRIR EM NOVA ABA
    window.open(whatsappURL, '_blank');

    return {
      success: true,
      message: `✅ Cupom ${coupon.label} aplicado! Aguardando aprovação via WhatsApp.`
    };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const calculateDiscount = (price) => {
    if (!appliedCoupon) return 0;
    return price * appliedCoupon.discount;
  };

  const calculateFinalPrice = (price) => {
    if (!appliedCoupon) return price;
    return price * (1 - appliedCoupon.discount);
  };

  return (
    <CouponContext.Provider
      value={{
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        calculateDiscount,
        calculateFinalPrice,
      }}
    >
      {children}
    </CouponContext.Provider>
  );
}

export const useCoupon = () => useContext(CouponContext);