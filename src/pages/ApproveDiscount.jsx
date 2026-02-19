import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';

export default function ApproveDiscount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const processApproval = async () => {
      const token = searchParams.get('token');
      const action = searchParams.get('action');

      if (!token || !action) {
        setStatus('error');
        setMessage('Link inválido.');
        return;
      }

      try {
        // 🔎 Buscar pedido pelo token
        const requestRef = doc(db, 'couponRequests', token);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
          setStatus('error');
          setMessage('Solicitação não encontrada.');
          return;
        }

        const requestData = requestSnap.data();

        // 🚫 Impedir reprocessamento
        if (requestData.approvalStatus !== 'waiting') {
          setStatus('error');
          setMessage('Essa solicitação já foi processada.');
          return;
        }

        const userRef = doc(db, 'users', requestData.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setStatus('error');
          setMessage('Usuário não encontrado.');
          return;
        }

        const userData = userSnap.data();

        // ===== REJEIÇÃO =====
        if (action === 'reject') {
          await updateDoc(requestRef, {
            approvalStatus: 'rejected',
            rejectedAt: new Date()
          });

          await updateDoc(userRef, {
            subscriptionStatus: 'rejected'
          });

          setUserInfo({
            name: userData.displayName || 'Sem nome',
            email: userData.email,
            coupon: requestData.requestedCoupon,
            action: 'rejected'
          });

          setStatus('success');
          return;
        }

        // ===== APROVAÇÃO =====
        const discount = requestData.requestedDiscount;
        const finalPrice = requestData.requestedPrice;

        // 100% OFF → ativa direto
        if (discount === 100) {
          await updateDoc(userRef, {
            subscriptionStatus: 'active',
            planId: requestData.requestedPlanId,
            subscriptionStartDate: new Date(),
            lifetime: requestData.requestedPlanId === 'lifetime',
            approvedAt: new Date()
          });

          await updateDoc(requestRef, {
            approvalStatus: 'approved',
            approvedAt: new Date()
          });

          setUserInfo({
            name: userData.displayName || 'Sem nome',
            email: userData.email,
            coupon: requestData.requestedCoupon,
            discount,
            fullAccess: true,
            action: 'approved'
          });
        } else {
          // desconto parcial → aguarda pagamento
          await updateDoc(userRef, {
            subscriptionStatus: 'awaiting_payment',
            subscriptionPrice: finalPrice,
            approvedAt: new Date()
          });

          await updateDoc(requestRef, {
            approvalStatus: 'approved_waiting_payment',
            approvedAt: new Date()
          });

          setUserInfo({
            name: userData.displayName || 'Sem nome',
            email: userData.email,
            coupon: requestData.requestedCoupon,
            discount,
            price: finalPrice,
            fullAccess: false,
            action: 'approved'
          });
        }

        setStatus('success');
      } catch (error) {
        console.error(error);
        setStatus('error');
        setMessage('Erro interno ao processar.');
      }
    };

    processApproval();
  }, [searchParams]);

  // ===== UI =====

  if (status === 'processing') {
    return (
      <CenterCard>
        <div className="animate-spin h-16 w-16 border-b-4 border-purple-600 rounded-full mx-auto mb-6"></div>
        <h2 className="text-xl font-bold">Processando solicitação...</h2>
      </CenterCard>
    );
  }

  if (status === 'error') {
    return (
      <CenterCard>
        <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Erro</h2>
        <p>{message}</p>
        <button
          onClick={() => navigate('/admin')}
          className="mt-6 px-6 py-3 bg-gray-700 text-white rounded-xl"
        >
          Voltar ao Admin
        </button>
      </CenterCard>
    );
  }

  if (status === 'success' && userInfo) {
    return (
      <CenterCard>
        {userInfo.action === 'rejected' ? (
          <>
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Solicitação Rejeitada</h2>
          </>
        ) : userInfo.fullAccess ? (
          <>
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">
              Acesso Liberado Gratuitamente
            </h2>
          </>
        ) : (
          <>
            <DocumentArrowUpIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">
              Aguardando Comprovante
            </h2>
          </>
        )}

        <div className="space-y-2 text-sm text-left bg-gray-100 dark:bg-gray-800 p-4 rounded-xl">
          <p><strong>Usuário:</strong> {userInfo.name}</p>
          <p><strong>Email:</strong> {userInfo.email}</p>
          <p><strong>Cupom:</strong> {userInfo.coupon}</p>
          {userInfo.discount && (
            <p><strong>Desconto:</strong> {userInfo.discount}%</p>
          )}
          {userInfo.price && (
            <p><strong>Valor final:</strong> R$ {userInfo.price.toFixed(2)}</p>
          )}
        </div>

        <button
          onClick={() => navigate('/admin')}
          className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl"
        >
          Ir para Admin
        </button>
      </CenterCard>
    );
  }

  return null;
}

function CenterCard({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
        {children}
      </div>
    </div>
  );
}
