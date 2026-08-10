'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

// Concierges (rol vendedor) que EL USUARIO ACTUAL afilió. Compartido entre
// AffiliateStats y MyConcierges para no duplicar la misma consulta.
export function useMyConcierges() {
  const { user } = useAuth();
  const [concierges, setConcierges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users'), where('affiliatedByUid', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setConcierges(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando concierges afiliados:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { concierges, loading };
}
