'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Card from '@/components/ui/Card/Card';
import Button from '@/components/ui/Button/Button';
import Swal from 'sweetalert2';
import QRScannerModal from '../QRScannerModal/QRScannerModal';
import ArrivalConfirmModal from '../ArrivalConfirmModal/ArrivalConfirmModal';
import './OnlineReservations.css';

// Apartado separado para las reservas que vienen del sitio web (pagadas con
// Clip, cada una con su boleto + QR). La cajera puede escanear el QR del
// cliente directamente, o tocar la tarjeta a mano si la cámara falla.
const OnlineReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'sales'), where('source', '==', 'sitio_web'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        setReservations(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando reservas del sitio web:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const pending = useMemo(() => reservations.filter((r) => r.status === 'Pending'), [reservations]);

  const openConfirm = (sale) => {
    setSelectedSale(sale);
    setIsConfirmOpen(true);
  };

  const closeConfirm = () => {
    setIsConfirmOpen(false);
    setSelectedSale(null);
  };

  // Del QR (o de cualquier QR reader del celular) llega la URL completa del
  // boleto -- se extrae el ID del final del link, o se usa tal cual si ya
  // es solo el ID.
  const extractSaleId = (decodedText) => {
    try {
      const url = new URL(decodedText);
      const parts = url.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1];
    } catch {
      return decodedText.trim();
    }
  };

  const handleScan = (decodedText) => {
    setIsScannerOpen(false);
    const saleId = extractSaleId(decodedText);
    const sale = reservations.find((r) => r.id === saleId);

    if (!sale) {
      Swal.fire('Código no encontrado', 'Ese QR no corresponde a ninguna reserva del sitio web.', 'error');
      return;
    }
    if (sale.status === 'Completed') {
      Swal.fire('Ya usado', 'Este boleto ya fue escaneado y confirmado antes.', 'info');
      return;
    }
    if (sale.status === 'Cancelled') {
      Swal.fire('Cancelado', 'Esta reserva fue cancelada.', 'error');
      return;
    }
    openConfirm(sale);
  };

  return (
    <>
      <Card title="Reservas en Línea (Sitio Web)">
        <div className="online-res-actions">
          <Button onClick={() => setIsScannerOpen(true)}>📷 Escanear QR</Button>
          <span className="online-res-count">{pending.length} en espera</span>
        </div>

        {loading ? (
          <p className="online-res-empty">Cargando...</p>
        ) : pending.length === 0 ? (
          <p className="online-res-empty">No hay reservas en línea pendientes.</p>
        ) : (
          <div className="online-res-grid">
            {pending.map((sale) => (
              <button key={sale.id} className="online-res-card" onClick={() => openConfirm(sale)}>
                <div className="online-res-card__top">
                  <span className="online-res-card__name">{sale.reservationFor || 'Sin nombre'}</span>
                  <span className="online-res-card__date">{sale.date}</span>
                </div>
                <div className="online-res-card__details">
                  <span>👥 {sale.quantity} pax</span>
                  {sale.scheduledTime && <span>🕐 {sale.scheduledTime}</span>}
                </div>
                <div className="online-res-card__ref">Ref. pago: {sale.paymentReference || 'N/A'}</div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleScan} />
      <ArrivalConfirmModal isOpen={isConfirmOpen} onClose={closeConfirm} sale={selectedSale} />
    </>
  );
};

export default OnlineReservations;
