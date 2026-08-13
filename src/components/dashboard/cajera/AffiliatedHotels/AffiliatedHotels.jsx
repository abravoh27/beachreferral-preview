'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Card from '@/components/ui/Card/Card';
import './AffiliatedHotels.css';

// Referencia para la cajera: SOLO hoteles con estado "active" (ya aprobados
// por un admin). No se muestran comisiones ni datos privados de la
// solicitud -- nada más lo que la cajera necesita para verificar al hotel.
const AffiliatedHotels = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'affiliateApplications'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (a.businessName || '').localeCompare(b.businessName || ''));
        setHotels(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando hoteles afiliados:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return hotels;
    return hotels.filter(
      (h) =>
        (h.businessName || '').toLowerCase().includes(term) ||
        (h.reference || '').toLowerCase().includes(term) ||
        (h.name || '').toLowerCase().includes(term)
    );
  }, [hotels, search]);

  return (
    <Card title={`Hoteles Afiliados (${hotels.length})`}>
      <input
        type="text"
        className="hotels-search"
        placeholder="Buscar por nombre, contacto o código..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="hotels-empty">Cargando...</p>
      ) : visible.length === 0 ? (
        <p className="hotels-empty">
          {hotels.length === 0 ? 'Todavía no hay hoteles activos.' : 'Sin resultados para esa búsqueda.'}
        </p>
      ) : (
        <div className="hotels-grid">
          {visible.map((h) => (
            <div key={h.id} className="hotel-card">
              <div className="hotel-card__header">
                <span className="hotel-card__name">🏨 {h.businessName}</span>
                <span className="hotel-card__badge">Activo</span>
              </div>
              <div className="hotel-card__row">Contacto: {h.name}</div>
              {h.interests && <div className="hotel-card__row">Experiencias: {h.interests}</div>}
              <div className="hotel-card__ref">{h.reference}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default AffiliatedHotels;
