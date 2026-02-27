import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const ADMIN_EMAIL = "medplanner17@gmail.com";

export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Verificar pelo email primeiro
        if (user.email === ADMIN_EMAIL) {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // Verificar pelo role no Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().role === "admin") {
          setIsAdmin(true);
        } else {
          console.warn("Usuário não é admin:", user.email);
        }
      } catch (error) {
        console.error("Erro ao verificar admin:", error);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Verificando permissão...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
}