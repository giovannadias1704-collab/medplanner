import { createContext, useState, useContext } from 'react';

export const CouponContext = createContext();

export function CouponProvider({ children }) {
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponPending, setCouponPending] = useState(false);

  const coupons = {
    MEDPLANNER30: { discount: 0.30, label: '30% OFF' },
    MEDPLANNER50: { discount: 0.50, label: '50% OFF' },
    MEDPLANNER100: { discount: 1.00, label: '100% OFF (GRÁTIS)' },
  };

  const validateCoupon = (code) => {
    const upperCode = code.toUpperCase().trim();
    return coupons[upperCode] || null;
  };

  const applyCoupon = async (code, planName, planPrice, userEmail) => {
    const coupon = validateCoupon(code);
    
    if (!coupon) {
      return { success: false, message: '❌ Cupom inválido!' };
    }

    // Enviar email de aprovação
    const emailSent = await sendApprovalEmail(code, planName, planPrice, coupon.discount, userEmail);
    
    if (emailSent) {
      setAppliedCoupon({ code, ...coupon });
      setCouponPending(true);
      return { 
        success: true, 
        message: '✅ Cupom válido! Aguardando aprovação por email (até 24h).',
        discount: coupon.discount
      };
    } else {
      return { success: false, message: '❌ Erro ao enviar email de aprovação. Tente novamente.' };
    }
  };

  const sendApprovalEmail = async (couponCode, planName, planPrice, discount, userEmail) => {
    try {
      const discountAmount = planPrice * discount;
      const finalPrice = planPrice - discountAmount;

      const emailData = {
        to_email: 'medplanner17@gmail.com',
        subject: `🎟️ NOVO CUPOM USADO: ${couponCode}`,
        message: `
🎟️ CUPOM DE DESCONTO USADO

📋 Informações:
• Código: ${couponCode}
• Desconto: ${discount * 100}%
• Plano: ${planName}
• Preço original: R$ ${planPrice.toFixed(2)}
• Desconto: -R$ ${discountAmount.toFixed(2)}
• Preço final: R$ ${finalPrice.toFixed(2)}
• Email do usuário: ${userEmail || 'Não informado'}

⏰ Data: ${new Date().toLocaleString('pt-BR')}

⚠️ AÇÃO NECESSÁRIA:
Entre em contato com o cliente para aprovar ou recusar o uso do cupom.
        `
      };

      // Enviar via EmailJS (vou configurar isso no próximo passo)
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: 'YOUR_SERVICE_ID', // Configurar depois
          template_id: 'YOUR_TEMPLATE_ID', // Configurar depois
          user_id: 'YOUR_PUBLIC_KEY', // Configurar depois
          template_params: emailData,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponPending(false);
  };

  const approveCoupon = () => {
    setCouponPending(false);
  };

  const calculateDiscount = (price) => {
    if (!appliedCoupon) return 0;
    return price * appliedCoupon.discount;
  };

  const calculateFinalPrice = (price) => {
    if (!appliedCoupon) return price;
    return price - calculateDiscount(price);
  };

  return (
    <CouponContext.Provider
      value={{
        appliedCoupon,
        couponPending,
        applyCoupon,
        removeCoupon,
        approveCoupon,
        calculateDiscount,
        calculateFinalPrice,
        validateCoupon,
      }}
    >
      {children}
    </CouponContext.Provider>
  );
}

export const useCoupon = () => useContext(CouponContext);