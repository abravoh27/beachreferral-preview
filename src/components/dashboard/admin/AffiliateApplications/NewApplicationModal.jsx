'use client';
import React, { useState } from 'react';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import Modal from '@/components/ui/Modal/Modal';
import Button from '@/components/ui/Button/Button';
import { generateAffiliateReference } from '@/lib/referenceGenerator';
import './NewApplicationModal.css';

const initialState = { name: '', businessName: '', roleType: '', phone: '', email: '', interests: '', monthlyGuests: '', notes: '' };

// Para agregar una solicitud a mano (mientras el sitio público no exista o
// para socios que llegaron por otro medio). Entra igual como "new".
const NewApplicationModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reference = generateAffiliateReference();
      await setDoc(doc(db, 'affiliateApplications', reference), {
        reference,
        ...formData,
        contactConsent: true,
        promotionsConsent: false,
        source: 'admin_manual',
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'affiliateApplications', reference, 'history'), {
        status: 'new',
        note: 'Solicitud agregada manualmente por Admin.',
        changedByUid: user.uid,
        changedByEmail: user.email,
        changedAt: serverTimestamp(),
      });

      Swal.fire({ title: 'Solicitud agregada', icon: 'success', timer: 1500, showConfirmButton: false });
      setFormData(initialState);
      onClose();
    } catch (error) {
      console.error('Error agregando solicitud:', error);
      Swal.fire('Error', 'No se pudo agregar la solicitud.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Solicitud de Afiliación">
      <form onSubmit={handleSubmit} className="new-app-form">
        <div className="new-app-form__row">
          <div className="input-group">
            <label>Nombre del contacto</label>
            <input id="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Negocio (Hotel/Agencia)</label>
            <input id="businessName" value={formData.businessName} onChange={handleChange} required />
          </div>
        </div>
        <div className="new-app-form__row">
          <div className="input-group">
            <label>Teléfono</label>
            <input id="phone" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input id="email" type="email" value={formData.email} onChange={handleChange} />
          </div>
        </div>
        <div className="input-group">
          <label>Notas</label>
          <textarea id="notes" value={formData.notes} onChange={handleChange} rows={2} />
        </div>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Agregar Solicitud'}</Button>
      </form>
    </Modal>
  );
};

export default NewApplicationModal;
