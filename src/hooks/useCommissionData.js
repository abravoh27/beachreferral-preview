'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Todas las ventas con llegada confirmada por la cajera (status Completed).
// Se filtra solo por status (una sola igualdad) para no requerir índice
// compuesto en Firestore; el filtro de semana se aplica del lado cliente.
export function useCompletedSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'sales'), where('status', '==', 'Completed'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setSales(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando ventas confirmadas:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { sales, loading };
}

// TODAS las ventas, sin importar estado (Pending/Completed/Cancelled).
// Se usa cuando hace falta ver el pipeline completo (ej. "Huéspedes
// Enviados" del afiliador), no solo lo ya confirmado por la cajera.
export function useAllSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'sales'),
      (snapshot) => {
        setSales(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando ventas:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { sales, loading };
}

// Todos los usuarios con rol vendedor (concierge), para saber quién afilió
// a quién (campo affiliatedByUid/affiliatedByEmail).
export function useConcierges() {
  const [concierges, setConcierges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'vendedor'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setConcierges(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando concierges:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { concierges, loading };
}
