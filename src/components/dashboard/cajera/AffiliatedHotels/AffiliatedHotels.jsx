'use client';
import React, { useMemo } from 'react';
import { useConcierges } from '@/hooks/useCommissionData';
import Card from '@/components/ui/Card/Card';
import './AffiliatedHotels.css';

// Referencia rápida para la cajera: qué hoteles tienen convenio (tienen al
// menos un concierge registrado) y quiénes son sus concierges. Útil para
// verificar que alguien que dice venir de "Hotel X" sí es un hotel afiliado.
const AffiliatedHotels = () => {
  const { concierges, loading } = useConcierges();

  const hotels = useMemo(() => {
    const map = new Map();
    concierges.forEach((c) => {
      const hotelName = (c.hotel || '').trim() || 'Sin hotel especificado';
      if (!map.has(hotelName)) {
        map.set(hotelName, []);
      }
      map.get(hotelName).push(c);
    });
    return Array.from(map.entries())
      .map(([hotel, people]) => ({ hotel, people }))
      .sort((a, b) => a.hotel.localeCompare(b.hotel));
  }, [concierges]);

  return (
    <Card title={`Hoteles Afiliados (${hotels.length})`}>
      {loading ? (
        <p className="hotels-empty">Cargando...</p>
      ) : hotels.length === 0 ? (
        <p className="hotels-empty">Todavía no hay hoteles con concierges registrados.</p>
      ) : (
        <div className="hotels-grid">
          {hotels.map(({ hotel, people }) => (
            <div key={hotel} className="hotel-card">
              <div className="hotel-card__header">
                <span className="hotel-card__name">🏨 {hotel}</span>
                <span className="hotel-card__count">{people.length} concierge{people.length === 1 ? '' : 's'}</span>
              </div>
              <ul className="hotel-card__people">
                {people.map((p) => (
                  <li key={p.id}>{p.name || p.email}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default AffiliatedHotels;
