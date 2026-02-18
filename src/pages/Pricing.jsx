import { useState } from 'react';
import { CheckCircleIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function Pricing() {
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ========== CONFIGURAÇÃO DO WHATSAPP ==========
  const WHATSAPP_NUMBER = '5571992883976';

  // ========== CUPONS VÁLIDOS (OCULTOS) ==========
  const validCoupons = {
    'MEDPLANNER30': { discount: 30, name: '30% OFF' },
    'MEDPLANNER50': { discount: 50, name: '50% OFF' },
    'MEDPLANNER100': { discount: 100, name: '100% OFF' }
  };

  // ========== VALIDAR E APLICAR CUPOM ==========
  const handleApplyCoupon = async () => {
    if (!user) {
      setCouponError('Faça login primeiro');
      return;
    }

    const code = couponCode.toUpperCase().trim();
    
    if (!code) {
      setCouponError('Digite um código');
      return;
    }

    if (!validCoupons[code]) {
      setCouponError('Cupom inválido');
      return;
    }

    setAppliedCoupon({ code, ...validCoupons[code] });
    setCouponError('');
    alert(`✅ Cupom ${code} aplicado!\n\n${validCoupons[code].name}\n\nEscolha seu plano e finalize no WhatsApp.`);
  };

  const plans = [
    {
      id: 'free',
      name: 'GRATUITO',
      emoji: '🆓',
      subtitle: 'Essencial para começar',
      price: 0,
      description: 'O plano perfeito para quem quer testar o planner, organizar tarefas simples e começar a estruturar a rotina.',
      color: 'gray',
      features: [
        { text: 'Home Principal', included: true },
        { text: 'Agenda integrada com calendário (até 10 eventos/mês)', included: true },
        { text: 'Sessões Casa, Estudos, Saúde, Finanças e Bem-estar (recursos básicos)', included: true },
        { text: 'Analytics diário simples', included: true },
        { text: 'Configurações pessoais básicas', included: true },
        { text: 'Acesso às atualizações básicas do planner', included: true },
        { text: 'Sem IA integrada', included: false },
        { text: 'Sem geração de questões inteligentes', included: false },
        { text: 'Sem upload de PDF automático', included: false },
        { text: 'Sem Sugestões inteligentes de ajustes no cronograma', included: false },
        { text: 'Sem análises comparativas avançadas', included: false }
      ],
      cta: 'Já Estou Usando',
      whatsappMessage: '',
      popular: false,
    },
    {
      id: 'student',
      name: 'ESTUDANTE',
      emoji: '🎓',
      subtitle: 'Organização com suporte de IA moderado',
      price: 12.99,
      description: 'Ideal para estudantes que querem usar IA para melhorar a organização, gerar questões e fazer análises do desempenho sem pagar muito.',
      color: 'indigo',
      features: [
        { text: 'Tudo do Plano Gratuito, mas com limitações removidas', included: true },
        { text: 'Agenda com eventos ilimitados', included: true },
        { text: 'Sessão Estudos completa (com opção PBL)', included: true },
        { text: 'Sessão Saúde, Finanças e Bem-estar completas', included: true },
        { text: 'Analytics completo — análises diária + comparativas (semanal, mensal e anual)', included: true },
        { text: 'IA integrada com limite mensal de consultas', included: true },
        { text: 'Upload de PDF para automatizar parte do plano', included: true },
        { text: 'Sugestões automáticas inteligentes para melhorar seu cronograma', included: true },
        { text: 'Geração de questões inteligentes (limitado por mês)', included: true },
        { text: 'Revisão de provas inteligente', included: true },
        { text: 'Sem ajustes automáticos completos no cronograma', included: false },
        { text: 'Sem suporte prioritário', included: false },
        { text: 'Sem exportação em PDF (relatórios profissionais)', included: false }
      ],
      cta: 'Assinar Estudante',
      whatsappMessage: 'Olá! Gostaria de assinar o *Plano Estudante* (R$ 12,99/mês) do MedPlanner. Como faço o pagamento?',
      popular: false,
    },
    {
      id: 'premium',
      name: 'PREMIUM',
      emoji: '⭐',
      subtitle: 'Automação completa e IA sem limites',
      price: 15.99,
      description: 'O plano ideal para quem quer automação total e ferramentas inteligentes sem limites — pensado para quem leva a organização a sério e quer resultados rápidos e consistentes.',
      color: 'purple',
      features: [
        { text: 'Tudo do Plano Estudante', included: true },
        { text: 'IA integrada ilimitada — responda perguntas, peça planos e estratégias sem limite', included: true },
        { text: 'Geração de questões inteligentes ilimitada', included: true },
        { text: 'Upload de PDFs sem restrições — o planner monta planos de estudo automaticamente', included: true },
        { text: 'Ajustes automáticos no cronograma com base nas respostas da avaliação contínua', included: true },
        { text: 'Exportação de relatórios PDF com visual profissional', included: true },
        { text: 'Analytics avançado com insights SMART (comparando metas e evolução)', included: true },
        { text: 'Sugestões proativas de melhorias no plano', included: true },
        { text: 'Prioridade na fila de suporte', included: true }
      ],
      cta: 'Assinar Premium',
      whatsappMessage: 'Olá! Gostaria de assinar o *Plano Premium* (R$ 15,99/mês) do MedPlanner. Como faço o pagamento?',
      popular: true,
    },
    {
      id: 'lifetime',
      name: 'VITALÍCIO',
      emoji: '🔥',
      subtitle: 'Tudo do Premium para sempre',
      price: 550,
      pixPrice: 480,
      installments: 5,
      description: 'Perfeito para quem quer usar o planner por anos sem pagar mensalidade, com acesso completo a tudo e sem limites futuros.',
      color: 'gold',
      features: [
        { text: 'Todos os recursos do Plano Premium', included: true },
        { text: 'Sem mensalidade NUNCA MAIS', included: true },
        { text: 'IA integrada ilimitada para sempre', included: true },
        { text: 'Acesso a todas as futuras atualizações sem custo', included: true },
        { text: 'Suporte prioritário vitalício', included: true }
      ],
      cta: 'Comprar Vitalício',
      whatsappMessagePix: 'Olá! Gostaria de comprar o *Plano Vitalício* por *R$ 480 no PIX* (pagamento único). Como faço?',
      whatsappMessageInstallment: 'Olá! Gostaria de comprar o *Plano Vitalício* parcelado em *5x de R$ 110* no cartão (total R$ 550). Como faço?',
      popular: false,
      lifetime: true,
    },
  ];

  const calculateDiscount = (price) => {
    if (!appliedCoupon) return price;
    return price * (1 - appliedCoupon.discount / 100);
  };

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
          <div className="text-sm text-gray-600 dark:text-gray-400">
            no PIX
          </div>
          {appliedCoupon && appliedCoupon.discount < 100 && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              ou 5x de R$ {(installmentPrice / 5).toFixed(2).replace('.', ',')}
            </div>
          )}
          {!appliedCoupon && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              ou 5x de R$ {(plan.price / 5).toFixed(2).replace('.', ',')}
            </div>
          )}
        </div>
      );
    }

    const finalPrice = calculateDiscount(plan.price);
    
    return `R$ ${finalPrice.toFixed(2).replace('.', ',')}`;
  };

  const handleSubscribe = async (plan) => {
    if (plan.id === 'free') {
      alert('✅ Você já está usando o plano gratuito!');
      return;
    }

    if (!user) {
      alert('⚠️ Faça login primeiro para assinar!');
      return;
    }

    setIsProcessing(true);

    try {
      let message = '';
      let finalPrice = plan.price;

      // Se for plano vitalício
      if (plan.id === 'lifetime') {
        const choice = window.confirm(
          '💎 PLANO VITALÍCIO - Escolha a forma de pagamento:\n\n' +
          '✅ OK = R$ 480 à vista no PIX\n' +
          '❌ CANCELAR = 5x de R$ 110 no cartão (total R$ 550)'
        );

        message = choice ? plan.whatsappMessagePix : plan.whatsappMessageInstallment;
        finalPrice = choice ? plan.pixPrice : plan.price;
      } else {
        // Planos mensais
        message = plan.whatsappMessage;
      }

      // SE TEM CUPOM APLICADO
      if (appliedCoupon) {
        const discount = appliedCoupon.discount;
        const discountedPrice = finalPrice * (1 - discount / 100);
        
        // Gerar token de segurança
        const token = btoa(`${user.uid}-${appliedCoupon.code}-medplanner-secret-2024`);
        
        // Gerar links de aprovação e rejeição
        const approveLink = `${window.location.origin}/approve-discount?user=${user.uid}&coupon=${appliedCoupon.code}&token=${token}&action=approve`;
        const rejectLink = `${window.location.origin}/approve-discount?user=${user.uid}&coupon=${appliedCoupon.code}&token=${token}&action=reject`;
        
        // Mensagem formatada com cupom
        message = `🎟️ *SOLICITAÇÃO DE ASSINATURA COM CUPOM*

━━━━━━━━━━━━━━━━━━━━
👤 *USUÁRIO*
Nome: ${user.displayName || 'Não informado'}
Email: ${user.email}

📦 *PLANO ESCOLHIDO*
${plan.name}

🎫 *CUPOM APLICADO*
Código: ${appliedCoupon.code}
Desconto: ${discount}% OFF

💰 *VALORES*
Preço original: R$ ${finalPrice.toFixed(2).replace('.', ',')}
Preço com desconto: R$ ${discountedPrice.toFixed(2).replace('.', ',')}
Economia: R$ ${(finalPrice - discountedPrice).toFixed(2).replace('.', ',')}
━━━━━━━━━━━━━━━━━━━━

✅ *APROVAR (1 clique):*
${approveLink}

❌ *REJEITAR (1 clique):*
${rejectLink}

_Clique em um dos links para processar!_`;

        // Salvar no Firebase
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          subscriptionStatus: 'pending_approval',
          requestedPlan: plan.name,
          requestedDiscount: discount,
          requestedCoupon: appliedCoupon.code,
          requestedAt: new Date().toISOString(),
          requestedPrice: discountedPrice,
          approvalLink: approveLink,
          rejectionLink: rejectLink
        });
      }

      // Enviar para WhatsApp
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');

      setIsProcessing(false);

      if (appliedCoupon) {
        alert(`✅ Solicitação enviada com cupom!\n\nAguarde aprovação via WhatsApp.`);
      }

    } catch (error) {
      console.error('Erro:', error);
      setIsProcessing(false);
      alert('❌ Erro ao processar. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 pb-32">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            🎯 Planos do Planner
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Descrição e Diferenças — Escolha o plano ideal para suas necessidades
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* Aviso de Pagamento */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 mb-12 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-3xl">💳</div>
            <div>
              <h3 className="text-xl font-bold mb-3">Como funcionam os pagamentos?</h3>
              <div className="space-y-2 text-blue-50">
                <p className="leading-relaxed">
                  <strong>✅ Todos os pagamentos são feitos via WhatsApp com contato direto.</strong>
                </p>
                <p className="leading-relaxed">
                  📅 <strong>Planos mensais (Estudante e Premium):</strong> Os valores serão recobrados todo mês via Nubank. <strong>Taxas bancárias do cartão de crédito são repassadas.</strong>
                </p>
                <p className="leading-relaxed">
                  💰 <strong>Plano Vitalício:</strong> Pagamento único — <strong>R$ 480 no PIX</strong> ou <strong>R$ 550 parcelado em até 5x no cartão.</strong>
                </p>
                <p className="leading-relaxed">
                  🔒 <strong>Seguro e confiável:</strong> Ao escolher seu plano, você será redirecionado para nosso WhatsApp onde finalizará a contratação com segurança.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Campo de Cupom - Discreto e Oculto */}
        {user && (
          <section className="max-w-md mx-auto mb-12">
            <details className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <summary className="font-bold text-gray-900 dark:text-white cursor-pointer text-center flex items-center justify-center gap-2">
                <SparklesIcon className="h-5 w-5 text-purple-600" />
                Tem um cupom de desconto?
              </summary>
              
              <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError('');
                    }}
                    placeholder="CÓDIGO"
                    className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-center font-bold focus:outline-none focus:border-purple-500"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isProcessing || !couponCode}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-all disabled:opacity-50"
                  >
                    Aplicar
                  </button>
                </div>

                {couponError && (
                  <p className="text-red-500 text-sm text-center">{couponError}</p>
                )}

                {appliedCoupon && (
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-3 text-center">
                    <p className="text-green-700 dark:text-green-300 font-bold">
                      ✅ {appliedCoupon.code} aplicado ({appliedCoupon.name})
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-500 text-center">
                  Cupons são enviados por email ou WhatsApp
                </p>
              </div>
            </details>
          </section>
        )}

        {/* Cards de Planos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 p-8 transition-all hover:scale-105 ${
                plan.popular 
                  ? 'border-purple-500 ring-4 ring-purple-200 dark:ring-purple-900/50'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4" />
                    MAIS POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="text-5xl mb-3">{plan.emoji}</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {plan.subtitle}
                </p>
                <div className="mb-2">
                  {typeof getPrice(plan) === 'string' ? (
                    <>
                      <span className="text-5xl font-bold text-gray-900 dark:text-white">
                        {getPrice(plan)}
                      </span>
                      {plan.price > 0 && !plan.lifetime && (
                        <span className="text-gray-600 dark:text-gray-400 text-lg">
                          /mês
                        </span>
                      )}
                    </>
                  ) : (
                    getPrice(plan)
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed text-center">
                {plan.description}
              </p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XMarkIcon className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${
                      feature.included 
                        ? 'text-gray-700 dark:text-gray-300 font-medium' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={isProcessing || (plan.id === 'free')}
                className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 ${
                  plan.id === 'lifetime'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white'
                    : plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                    : plan.id === 'free'
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white'
                }`}
              >
                {isProcessing ? 'Processando...' : plan.cta}
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
                Te envio link de pagamento seguro (Pix/Cartão)
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            ❓ Dúvidas Frequentes
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                q: '💳 Como funciona o pagamento mensal?',
                a: 'Após contratar via WhatsApp, você recebe um link de pagamento recorrente via Nubank. Todo mês é cobrado automaticamente. Taxas de cartão são repassadas.'
              },
              {
                q: '🔄 Posso trocar de plano depois?',
                a: 'Sim! Entre em contato pelo WhatsApp e faremos upgrade ou downgrade imediatamente.'
              },
              {
                q: '🔥 Vale a pena o Plano Vitalício?',
                a: 'Se você planeja usar o MedPlanner por mais de 3 anos, o Plano Vitalício se paga sozinho e você nunca mais terá mensalidades!'
              },
              {
                q: '📞 Como entro em contato?',
                a: 'Clique no botão "Assinar" de qualquer plano e você será redirecionado para nosso WhatsApp oficial.'
              },
              {
                q: '💰 Quais formas de pagamento aceitam?',
                a: 'PIX (instantâneo e com desconto no vitalício), Cartão de Crédito via Nubank e Boleto.'
              },
              {
                q: '❌ Posso cancelar quando quiser?',
                a: 'Sim! Sem multas ou fidelidade. É só avisar pelo WhatsApp e cancelamos na hora.'
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
              >
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                  {faq.q}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-center shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            🚀 Pronto para transformar seus estudos?
          </h2>
          <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de estudantes de medicina que já estão organizando melhor seu tempo!
          </p>
          <button 
            onClick={() => {
              const message = encodeURIComponent('Olá! Gostaria de conhecer melhor o MedPlanner e seus planos! 🩺');
              window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
            }}
            className="bg-white text-purple-600 px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
          >
            💬 Falar no WhatsApp
          </button>
          <p className="text-purple-200 text-sm mt-4">
            ✓ Resposta rápida • ✓ Tire suas dúvidas • ✓ Comece hoje mesmo
          </p>
        </div>

      </div>
    </div>
  );
}