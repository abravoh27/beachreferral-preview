'use client';
import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card/Card';
import './MyConcierges.css';

// Lista, en tiempo real, los concierges que ESTE afiliador dio de alta.
// Así queda visible quién afilió a quién (campo affiliatedByUid en /users).
const MyConcierges = () => {
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

  return (
    <Card title={`Mis Concierges Afiliados (${concierges.length})`}>
      {loading ? (
        <p className="my-concierges-empty">Cargando...</p>
      ) : concierges.length === 0 ? (
        <p className="my-concierges-empty">Aún no has afiliado a ningún concierge.</p>
      ) : (
        <ul className="concierge-list">
          {concierges.map((c) => (
            <li key={c.id} className="concierge-item">
              <div>
                <strong>{c.name || c.email}</strong>
                <span className="concierge-meta">{c.email}</span>
              </div>
              {c.hotel && <span className="concierge-hotel">{c.hotel}</span>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default MyConcierges;
