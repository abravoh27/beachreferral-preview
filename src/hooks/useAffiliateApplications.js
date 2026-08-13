'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Todas las solicitudes de afiliación (hoteles/concierges/agencias), en
// tiempo real. El filtro por estado se hace del lado del cliente.
export function useAffiliateApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'affiliateApplications'),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setApplications(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando solicitudes de afiliación:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { applications, loading };
}
