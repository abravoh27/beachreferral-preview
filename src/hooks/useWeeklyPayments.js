'use client';
import { useEffect, useState } from 'react';
import { collection, doc, query, where, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Marca si la comisión de un afiliador, para una semana dada, ya fue
// cobrada/pagada. Guarda un doc por (afiliador, semana) en la colección
// "weeklyPayments" con id `${afiliadorUid}_${weekStartStr}`.
export function useWeeklyPayments(weekStartStr) {
  const [payments, setPayments] = useState({}); // { [afiliadorUid]: paymentDoc }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!weekStartStr) return;

    const q = query(collection(db, 'weeklyPayments'), where('weekStart', '==', weekStartStr));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const map = {};
        snapshot.docs.forEach((d) => {
          const data = d.data();
          map[data.afiliadorUid] = { id: d.id, ...data };
        });
        setPayments(map);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando pagos semanales:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [weekStartStr]);

  return { payments, loading };
}

export async function setWeeklyPaymentStatus({ afiliadorUid, afiliadorEmail, week, paid, totalPax, totalAmount, markedBy }) {
  const docId = `${afiliadorUid}_${week.startStr}`;
  await setDoc(
    doc(db, 'weeklyPayments', docId),
    {
      afiliadorUid,
      afiliadorEmail,
      weekStart: week.startStr,
      weekEnd: week.endStr,
      paid,
      totalPax,
      totalAmount,
      updatedAt: serverTimestamp(),
      updatedByUid: markedBy?.uid || '',
      updatedByEmail: markedBy?.email || '',
    },
    { merge: true }
  );
}
