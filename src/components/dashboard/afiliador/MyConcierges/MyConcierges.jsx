'use client';
import React from 'react';
import { useMyConcierges } from '@/hooks/useMyConcierges';
import Card from '@/components/ui/Card/Card';
import './MyConcierges.css';

// Lista, en tiempo real, los concierges que ESTE afiliador dio de alta.
const MyConcierges = () => {
  const { concierges, loading } = useMyConcierges();

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
