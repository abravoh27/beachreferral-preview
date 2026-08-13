'use client';
import React, { useEffect, useState } from 'react';
import { doc, updateDoc, collection, addDoc, onSnapshot, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import Modal from '@/components/ui/Modal/Modal';
import Button from '@/components/ui/Button/Button';
import { STATUS_CONFIG, STATUS_TRANSITIONS, REJECTABLE_FROM } from '@/lib/affiliateApplicationStatus';
import './AffiliateApplicationDetail.css';

const FIELD_LABELS = {
  name: 'Contacto',
  businessName: 'Negocio',
  roleType: 'Tipo de afiliado',
  phone: 'Teléfono',
  email: 'Correo',
  interests: 'Experiencias de interés',
  monthlyGuests: 'Volumen mensual estimado',
  notes: 'Notas',
};

const AffiliateApplicationDetail = ({ application, isOpen, onClose }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!application?.id || !isOpen) return undefined;
    const q = query(collection(db, 'affiliateApplications', application.id, 'history'), orderBy('changedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [application?.id, isOpen]);

  if (!application) return null;

  const statusInfo = STATUS_CONFIG[application.status] || { label: application.status, bg: '#eee', text: '#333' };
  const transitions = STATUS_TRANSITIONS[application.status] || [];
  const canReject = REJECTABLE_FROM.includes(application.status);

  const changeStatus = async (newStatus, extraConfirmText) => {
    const isActivating = newStatus === 'active';
    const { isConfirmed } = await Swal.fire({
      title: isActivating ? '¿Activar como Hotel Afiliado?' : `¿Cambiar a "${STATUS_CONFIG[newStatus]?.label}"?`,
      text: extraConfirmText || (isActivating ? 'A partir de ahora aparecerá en la lista de la cajera.' : undefined),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: isActivating ? '#28a745' : '#007bff',
    });
    if (!isConfirmed) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'affiliateApplications', application.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'affiliateApplications', application.id, 'history'), {
        status: newStatus,
        note: note.trim() || `Cambiado a ${STATUS_CONFIG[newStatus]?.label || newStatus}`,
        changedByUid: user.uid,
        changedByEmail: user.email,
        changedAt: serverTimestamp(),
      });
      setNote('');
      Swal.fire({ title: 'Actualizado', icon: 'success', timer: 1300, showConfirmButton: false });
    } catch (error) {
      console.error('Error actualizando solicitud:', error);
      Swal.fire('Error', 'No se pudo actualizar la solicitud.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: '¿Rechazar esta solicitud?',
      input: 'textarea',
      inputLabel: 'Motivo (opcional)',
      showCancelButton: true,
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    });
    if (!isConfirmed) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'affiliateApplications', application.id), {
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'affiliateApplications', application.id, 'history'), {
        status: 'rejected',
        note: reason || 'Solicitud rechazada.',
        changedByUid: user.uid,
        changedByEmail: user.email,
        changedAt: serverTimestamp(),
      });
      Swal.fire({ title: 'Solicitud rechazada', icon: 'info', timer: 1300, showConfirmButton: false });
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      Swal.fire('Error', 'No se pudo rechazar la solicitud.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={application.businessName}>
      <div className="app-detail">
        <div className="app-detail__status">
          <span className="app-detail__badge" style={{ background: statusInfo.bg, color: statusInfo.text }}>
            {statusInfo.label}
          </span>
          <span className="app-detail__ref">{application.reference}</span>
        </div>

        <div className="app-detail__fields">
          {Object.entries(FIELD_LABELS).map(([key, label]) => (
            <div key={key} className="app-detail__field">
              <span className="app-detail__field-label">{label}</span>
              <span className="app-detail__field-value">{application[key] || '-'}</span>
            </div>
          ))}
        </div>

        {(transitions.length > 0 || canReject) && (
          <div className="app-detail__actions-section">
            <label className="app-detail__note-label">Nota (opcional, queda en el historial)</label>
            <textarea
              className="app-detail__note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Se enviaron condiciones por WhatsApp el 13/08..."
              rows={2}
            />
            <div className="app-detail__actions">
              {transitions.map((t) => (
                <Button key={t.to} onClick={() => changeStatus(t.to)} disabled={saving} variant={t.primary ? 'primary' : 'secondary'}>
                  {t.label}
                </Button>
              ))}
              {canReject && (
                <button className="app-detail__reject-btn" onClick={handleReject} disabled={saving}>
                  Rechazar
                </button>
              )}
            </div>
          </div>
        )}

        <div className="app-detail__history">
          <h4>Historial</h4>
          {history.length === 0 ? (
            <p className="app-detail__history-empty">Sin cambios registrados todavía.</p>
          ) : (
            <ul>
              {history.map((h) => (
                <li key={h.id}>
                  <div className="app-detail__history-top">
                    <span className="app-detail__history-status" style={{ color: STATUS_CONFIG[h.status]?.text || '#333' }}>
                      {STATUS_CONFIG[h.status]?.label || h.status}
                    </span>
                    <span className="app-detail__history-by">{h.changedByEmail}</span>
                  </div>
                  {h.note && <p className="app-detail__history-note">{h.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AffiliateApplicationDetail;
