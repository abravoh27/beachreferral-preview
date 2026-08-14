'use client';
import React, { useMemo, useState } from 'react';
import { useAllSales } from '@/hooks/useCommissionData';
import { useMyConcierges } from '@/hooks/useMyConcierges';
import Card from '@/components/ui/Card/Card';
import './GuestsSent.css';

const STATUS_INFO = {
  Pending: { label: 'Pendiente', bg: '#fff3cd', text: '#856404' },
  Completed: { label: 'Confirmado', bg: '#d4edda', text: '#155724' },
  Cancelled: { label: 'Cancelado', bg: '#f8d7da', text: '#721c24' },
};

const NEW_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 horas

// Todo lo que los concierges de este afiliador han mandado, sin importar si
// la cajera ya confirmó la llegada o no -- así el afiliador ve su pipeline
// completo en tiempo real, no solo lo que ya cuenta para su comisión.
const GuestsSent = () => {
  const { sales, loading: loadingSales } = useAllSales();
  const { concierges, loading: loadingConcierges } = useMyConcierges();
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Pending' | 'Completed' | 'Cancelled'

  const loading = loadingSales || loadingConcierges;

  const myConciergeIds = useMemo(() => new Set(concierges.map((c) => c.id)), [concierges]);
  const conciergeById = useMemo(() => {
    const map = new Map();
    concierges.forEach((c) => map.set(c.id, c));
    return map;
  }, [concierges]);

  const myGuests = useMemo(() => {
    const list = sales
      .filter((s) => myConciergeIds.has(s.sellerId))
      .map((s) => ({ ...s, concierge: conciergeById.get(s.sellerId) }));
    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    return list;
  }, [sales, myConciergeIds, conciergeById]);

  const visibleGuests = statusFilter === 'all' ? myGuests : myGuests.filter((g) => g.status === statusFilter);

  const counts = useMemo(() => {
    const c = { all: myGuests.length, Pending: 0, Completed: 0, Cancelled: 0 };
    myGuests.forEach((g) => {
      if (c[g.status] !== undefined) c[g.status] += 1;
    });
    return c;
  }, [myGuests]);

  const isNew = (sale) => {
    if (!sale.createdAt?.toDate) return false;
    return Date.now() - sale.createdAt.toDate().getTime() < NEW_THRESHOLD_MS;
  };

  return (
    <Card title={`Huéspedes Enviados (${counts.all})`}>
      <div className="guests-filters">
        <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>
          Todos ({counts.all})
        </button>
        <button className={statusFilter === 'Pending' ? 'active' : ''} onClick={() => setStatusFilter('Pending')}>
          Pendientes ({counts.Pending})
        </button>
        <button className={statusFilter === 'Completed' ? 'active' : ''} onClick={() => setStatusFilter('Completed')}>
          Confirmados ({counts.Completed})
        </button>
        <button className={statusFilter === 'Cancelled' ? 'active' : ''} onClick={() => setStatusFilter('Cancelled')}>
          Cancelados ({counts.Cancelled})
        </button>
      </div>

      {loading ? (
        <p className="guests-empty">Cargando...</p>
      ) : visibleGuests.length === 0 ? (
        <p className="guests-empty">
          {counts.all === 0
            ? 'Todavía no hay huéspedes enviados por tus concierges.'
            : 'No hay nada en este filtro.'}
        </p>
      ) : (
        <div className="table-container">
          <table className="guests-table">
            <thead>
              <tr>
                <th>Huésped</th>
                <th>Concierge</th>
                <th>Fecha</th>
                <th>Pax</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {visibleGuests.map((g) => {
                const statusInfo = STATUS_INFO[g.status] || { label: g.status || '-', bg: '#e2e3e5', text: '#383d41' };
                return (
                  <tr key={g.id}>
                    <td data-label="Huésped">
                      {g.reservationFor || 'Sin nombre'}
                      {isNew(g) && <span className="guests-new-badge">Nuevo</span>}
                    </td>
                    <td data-label="Concierge">{g.concierge?.name || g.sellerEmail || 'N/A'}</td>
                    <td data-label="Fecha">{g.date}</td>
                    <td data-label="Pax">{g.quantity}</td>
                    <td data-label="Estado">
                      <span className="guests-status-badge" style={{ background: statusInfo.bg, color: statusInfo.text }}>
                        {statusInfo.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default GuestsSent;
