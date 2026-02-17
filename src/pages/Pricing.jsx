import { useState } from 'react';
import { CheckCircleIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' ou 'yearly'

  // ========== CONFIGURAÇÃO DO WHATSAPP ==========
  const WHATSAPP_NUMBER = '5571992883976'; // ← SEU NÚMERO
  
  const plans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 0,
      yearlyPrice: 0,
      description: 'Para conhecer a plataforma',
      color: 'gray',
      features: [
        { text: 'Até 10 eventos/mês', included: true },
        { text: 'Sem IA', included: false },
        { text: 'Máximo 3 PBLs', included: true },
        { text: 'Analytics básico', included: true },
        { text: 'PBLs ilimitados', included: false },
        { text: 'Exportação PDF', included: false },
        { text: 'Suporte prioritário', included: false },
      ],
      cta: 'Já Estou Usando',
      whatsappMessage: '',
      popular: false,
    },
    {
      id: 'student',
      name: 'Estudante',
      price: 7.90,
      yearlyPrice: 79.00,
      description: 'Ideal para estudantes de medicina',
      color: 'indigo',
      features: [
        { text: 'Eventos ilimitados', included: true },
        { text: 'IA com 100 consultas/mês', included: true },
        { text: 'PBLs ilimitados', included: true },
        { text: 'Analytics completo', included: true },
        { text: 'Sincronização multi-dispositivo', included: true },
        { text: 'Exportação PDF', included: false },
        { text: 'Suporte prioritário', included: false },
      ],
      cta: 'Assinar Estudante',
      whatsappMessage: 'Olá! Gostaria de assinar o *Plano Estudante* (R$ 7,90/mês) do MedPlanner. Como faço o pagamento?',
      popular: false,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 15.90,
      yearlyPrice: 159.00,
      description: 'Máximo desempenho e recursos',
      color: 'purple',
      features: [
        { text: 'Tudo do plano Estudante', included: true },
        { text: 'IA ilimitada', included: true },
        { text: 'Exportação em PDF', included: true },
        { text: 'Suporte prioritário', included: true },
        { text: 'Acesso antecipado a novos recursos', included: true },
        { text: 'Consultoria de estudos 1x/mês', included: true },
        { text: 'Certificado de conclusão', included: true },
      ],
      cta: 'Assinar Premium',
      whatsappMessage: 'Olá! Gostaria de assinar o *Plano Premium* (R$ 15,90/mês) do MedPlanner. Como faço o pagamento?',
      popular: false,
    },
    {
      id: 'lifetime',
      name: 'Vitalício',
      price: 250,
      installmentPrice: 300,
      installments: 5,
      description: '✨ Acesso PERMANENTE',
      color: 'gold',
      features: [
        { text: '🔥 TODOS OS RECURSOS PREMIUM', included: true },
        { text: '♾️ Acesso VITALÍCIO', included: true },
        { text: 'IA ilimitada PARA SEMPRE', included: true },
        { text: 'TODAS as atualizações futuras', included: true },
        { text: 'Suporte prioritário vitalício', included: true },
        { text: 'Sem mensalidade NUNCA MAIS', included: true },
        { text: '💰 Melhor custo-benefício', included: true },
      ],
      cta: 'Comprar Vitalício',
      whatsappMessagePix: 'Olá! Gostaria de comprar o *Plano Vitalício* por *R$ 250 no PIX* (pagamento único). Como faço?',
      whatsappMessageInstallment: 'Olá! Gostaria de comprar o *Plano Vitalício* parcelado em *5x de R$ 60* (total R$ 300). Como faço?',
      popular: true,
      lifetime: true,
    },
  ];

  const getPrice = (plan) => {
    if (plan.price === 0) return 'Grátis';
    
    if (plan.lifetime) {
      return (
        <div>
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
            R$ 250 à vista
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            ou 5x de R$ 60
          </div>
        </div>
      );
    }

    const price = billingPeriod === 'monthly' ? plan.price : plan.yearlyPrice;
    return billingPeriod === 'monthly' 
      ? `R$ ${price.toFixed(2).replace('.', ',')}` 
      : `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const getSavings = (plan) => {
    if (plan.price === 0) return null;
    const monthlyTotal = plan.price * 12;
    const savings = monthlyTotal - plan.yearlyPrice;
    return savings > 0 ? savings : 0;
  };

  const handleSubscribe = (plan) => {
    if (plan.id === 'free') {
      alert('✅ Você já está usando o plano gratuito!');
      return;
    }

    // Se for plano vitalício, mostrar opções de pagamento
    if (plan.id === 'lifetime') {
      const choice = window.confirm(
        '💎 PLANO VITALÍCIO - Escolha a forma de pagamento:\n\n' +
        '✅ OK = R$ 250 à vista no PIX\n' +
        '❌ CANCELAR = 5x de R$ 60 no cartão (total R$ 300)'
      );

      const message = choice ? plan.whatsappMessagePix : plan.whatsappMessageInstallment;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      return;
    }

    // Planos mensais
    let message = plan.whatsappMessage;
    if (billingPeriod === 'yearly') {
      message = `Olá! Gostaria de assinar o *Plano ${plan.name}* (R$ ${plan.yearlyPrice.toFixed(2).replace('.', ',')}/ano) do MedPlanner. Como faço o pagamento?`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 pb-32">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            💎 Escolha seu Plano
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Transforme seus estudos de medicina com a plataforma mais completa do Brasil
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* Benefício de Pagamento */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 mb-12 text-center max-w-3xl mx-auto">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
            💳 Pagamento Facilitado via WhatsApp
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Aceito <strong>Pix, Cartão de Crédito (Nubank, etc.) e Boleto</strong>. Após escolher seu plano, você será direcionado ao WhatsApp para finalizar!
          </p>
        </div>

        {/* Toggle Mensal/Anual */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-6 py-3 rounded-xl font-bold transition-all relative ${
              billingPeriod === 'yearly'
                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600'
            }`}
          >
            Anual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
              -17%
            </span>
          </button>
        </div>

        {/* Cards de Planos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 p-8 transition-all hover:scale-105 animate-slide-in ${
                plan.popular 
                  ? plan.lifetime
                    ? 'border-yellow-500 ring-4 ring-yellow-200 dark:ring-yellow-900/50'
                    : 'border-indigo-500 ring-4 ring-indigo-200 dark:ring-indigo-900/50'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className={`${
                    plan.lifetime 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600'
                  } text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2`}>
                    <SparklesIcon className="h-4 w-4" />
                    MAIS POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {plan.description}
                </p>
                <div className="mb-2">
                  {typeof getPrice(plan) === 'string' ? (
                    <>
                      <span className="text-5xl font-bold text-gray-900 dark:text-white">
                        {getPrice(plan)}
                      </span>
                      {plan.price > 0 && !plan.lifetime && (
                        <span className="text-gray-600 dark:text-gray-400 text-lg">
                          /{billingPeriod === 'monthly' ? 'mês' : 'ano'}
                        </span>
                      )}
                    </>
                  ) : (
                    getPrice(plan)
                  )}
                </div>
                {billingPeriod === 'yearly' && getSavings(plan) > 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                    💰 Economize R$ {getSavings(plan).toFixed(2).replace('.', ',')} por ano
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XMarkIcon className="h-6 w-6 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${
                      feature.included 
                        ? 'text-gray-700 dark:text-gray-300 font-medium' 
                        : 'text-gray-400 dark:text-gray-500 line-through'
                    }`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg hover-lift ${
                  plan.lifetime
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white'
                    : plan.popular
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                    : plan.id === 'free'
                    ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Como Funciona */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            📱 Como Funciona o Pagamento
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">1️⃣</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Escolha seu Plano</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Clique em "Assinar" no plano desejado
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">2️⃣</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Abrir WhatsApp</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Você será redirecionado para nossa conversa
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">3️⃣</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Receber Link</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Te envio link de pagamento (Pix/Cartão)
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            ❓ Perguntas Frequentes
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                q: 'Quais formas de pagamento aceitam?',
                a: 'Pix (instantâneo), Cartão de Crédito (Nubank, Visa, Master, etc.) e Boleto.'
              },
              {
                q: 'Posso cancelar quando quiser?',
                a: 'Sim! Sem multas ou taxas. É só me avisar pelo WhatsApp.'
              },
              {
                q: 'Como funciona a assinatura?',
                a: 'Você paga mensalmente. Te envio um lembrete antes do vencimento.'
              },
              {
                q: 'Tem período de teste grátis?',
                a: 'Sim! 7 dias grátis para você testar todos os recursos premium.'
              },
              {
                q: 'Meus dados ficam salvos?',
                a: 'Sim! Tudo sincronizado na nuvem automaticamente.'
              },
              {
                q: 'E se eu esquecer de pagar?',
                a: 'Sua conta volta para o plano gratuito, mas seus dados ficam salvos!'
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400">Q:</span> {faq.q}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-12 text-center shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            🚀 Pronto para transformar seus estudos?
          </h2>
          <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de estudantes de medicina que já estão organizando melhor seu tempo!
          </p>
          <button 
            onClick={() => {
              const message = encodeURIComponent('Olá! Gostaria de conhecer melhor o MedPlanner e seus planos! 🩺');
              window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
            }}
            className="bg-white text-indigo-600 px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover-lift"
          >
            💬 Falar no WhatsApp
          </button>
          <p className="text-indigo-200 text-sm mt-4">
            ✓ Resposta rápida • ✓ Tire suas dúvidas • ✓ Comece hoje mesmo
          </p>
        </div>

      </div>
    </div>
  );
}