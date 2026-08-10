'use client';
import React, { useEffect, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/ui/Modal/Modal';
import Button from '@/components/ui/Button/Button';
import Swal from 'sweetalert2';
import './ArrivalConfirmModal.css';

const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const ArrivalConfirmModal = ({ sale, isOpen, onClose }) => {
  const { user } = useAuth();
  const [entryTime, setEntryTime] = useState(getCurrentTime());
  const [folio, setFolio] = useState('');
  const [wristbandColor, setWristbandColor] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sale) {
      setEntryTime(sale.entryTime || getCurrentTime());
      setFolio(sale.folio || '');
      setWristbandColor(sale.wristbandColor || '');
    }
  }, [sale]);

  if (!sale) return null;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'sales', sale.id), {
        status: 'Completed',
        entryTime,
        folio,
        wristbandColor,
        confirmedBy: user?.email || '',
        updatedAt: serverTimestamp(),
      });
      Swal.fire({
        title: '¡Llegada confirmada!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      onClose();
    } catch (error) {
      console.error('Error al confirmar llegada:', error);
      Swal.fire('Error', 'No se pudo confirmar la llegada.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleNoShow = async () => {
    const { value: observation, isConfirmed } = await Swal.fire({
      title: '¿Marcar como no llegó / cancelar?',
      input: 'textarea',
      inputLabel: 'Motivo (opcional)',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#dc3545',
    });
    if (!isConfirmed) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'sales', sale.id), {
        status: 'Cancelled',
        observation: observation || '',
        confirmedBy: user?.email || '',
        updatedAt: serverTimestamp(),
      });
      Swal.fire({ title: 'Marcada como cancelada', icon: 'info', timer: 1500, showConfirmButton: false });
      onClose();
    } catch (error) {
      console.error('Error al cancelar reserva:', error);
      Swal.fire('Error', 'No se pudo actualizar la reserva.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Confirmar Llegada - ${sale.reservationFor || sale.city}`}>
      <div className="arrival-modal-content">
        <div className="info-grid">
          <div className="info-item"><strong>Concierge:</strong> {sale.referredBy || 'N/A'}</div>
          <div className="info-item"><strong>Ciudad:</strong> {sale.city}</div>
          <div className="info-item"><strong>Pax:</strong> {sale.quantity}</div>
          <div className="info-item"><strong>Fecha:</strong> {sale.date}</div>
        </div>

        <div className="form-group">
          <label>Hora de llegada</label>
          <input type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} className="admin-input" />
        </div>
        <div className="form-group">
          <label>Folio</label>
          <input type="text" value={folio} onChange={(e) => setFolio(e.target.value)} className="admin-input" placeholder="#000" />
        </div>
        <div className="form-group">
          <label>Color de pulsera</label>
          <input
            type="text"
            value={wristbandColor}
            onChange={(e) => setWristbandColor(e.target.value)}
            className="admin-input"
            placeholder="Ej. Azul"
          />
        </div>

        <div className="modal-actions">
          <Button onClick={handleNoShow} variant="secondary" disabled={saving}>No llegó</Button>
          <Button onClick={handleConfirm} disabled={saving}>
            {saving ? 'Guardando...' : '✅ Confirmar Llegada'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ArrivalConfirmModal;
