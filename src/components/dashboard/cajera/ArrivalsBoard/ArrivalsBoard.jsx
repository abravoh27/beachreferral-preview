'use client';
import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Card from '@/components/ui/Card/Card';
import ArrivalConfirmModal from '../ArrivalConfirmModal/ArrivalConfirmModal';
import './ArrivalsBoard.css';

const getTodayStr = () => new Date().toISOString().split('T')[0];

// Tablero pensado para la cajera del Beach Club: en vez de la tabla completa
// de administración, muestra sólo lo que a ella le importa -- reservas en
// espera de llegada -- como tarjetas grandes y clicables. Se actualiza en
// tiempo real (onSnapshot) apenas un concierge registra una venta nueva.
const ArrivalsBoard = () => {
  const [pendingSales, setPendingSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today'); // 'today' | 'all'
  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'sales'), where('status', '==', 'Pending'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Las reservas del sitio web (source: "sitio_web") tienen su propio
        // apartado ("Reservas en Línea") con escáner de QR -- no se listan aquí.
        const data = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => s.source !== 'sitio_web');
        data.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        setPendingSales(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando llegadas pendientes:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const todayStr = getTodayStr();
  const visibleSales = dateFilter === 'today'
    ? pendingSales.filter((s) => s.date === todayStr)
    : pendingSales;

  const handleOpen = (sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedSale(null);
  };

  return (
    <>
      <Card title="Llegadas Pendientes">
        <div className="arrivals-filters">
          <button className={dateFilter === 'today' ? 'active' : ''} onClick={() => setDateFilter('today')}>
            Hoy
          </button>
          <button className={dateFilter === 'all' ? 'active' : ''} onClick={() => setDateFilter('all')}>
            Todas
          </button>
          <span className="arrivals-count">{visibleSales.length} en espera</span>
        </div>

        {loading ? (
          <p className="arrivals-empty">Cargando...</p>
        ) : visibleSales.length === 0 ? (
          <p className="arrivals-empty">
            No hay llegadas pendientes{dateFilter === 'today' ? ' para hoy' : ''}. 🎉
          </p>
        ) : (
          <div className="arrivals-grid">
            {visibleSales.map((sale) => (
              <button key={sale.id} className="arrival-card" onClick={() => handleOpen(sale)}>
                <div className="arrival-card__top">
                  <span className="arrival-card__name">{sale.reservationFor || 'Sin nombre'}</span>
                  <span className={`arrival-card__badge ${sale.date === todayStr ? 'is-today' : ''}`}>
                    {sale.date}
                  </span>
                </div>
                <div className="arrival-card__details">
                  <span>👥 {sale.quantity} pax</span>
                  <span>📍 {sale.city}</span>
                </div>
                <div className="arrival-card__concierge">
                  Concierge: <strong>{sale.referredBy || 'N/A'}</strong>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <ArrivalConfirmModal isOpen={isModalOpen} onClose={handleClose} sale={selectedSale} />
    </>
  );
};

export default ArrivalsBoard;
