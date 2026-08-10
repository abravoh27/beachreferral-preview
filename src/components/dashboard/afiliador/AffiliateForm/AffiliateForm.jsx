'use client';
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { secondaryAuth } from '@/lib/firebaseSecondary';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import Input from '@/components/ui/Input/Input';
import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import './AffiliateForm.css';

const initialState = { name: '', email: '', hotel: '', phone: '' };

// Genera una contraseña temporal aleatoria. El concierge nunca la ve:
// se le manda un correo de "restablecer contraseña" para que defina la suya.
const generateTempPassword = () =>
  Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

const AffiliateForm = ({ onAffiliated }) => {
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

    const email = formData.email.trim().toLowerCase();

    try {
      // 1. Crear la cuenta en Firebase Auth con la app SECUNDARIA, para no
      //    cerrar la sesión del afiliador que está haciendo el alta.
      const { user: newUser } = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        generateTempPassword()
      );

      // 2. Dar de alta al concierge en Firestore, registrando quién lo afilió.
      await setDoc(doc(db, 'users', newUser.uid), {
        name: formData.name.trim(),
        email,
        hotel: formData.hotel.trim(),
        phone: formData.phone.trim(),
        role: 'vendedor',
        affiliatedByUid: user.uid,
        affiliatedByEmail: user.email,
        createdAt: serverTimestamp(),
      });

      // 3. Enviar correo para que el concierge defina su propia contraseña.
      await sendPasswordResetEmail(secondaryAuth, email);

      // 4. Cerrar la sesión temporal de la app secundaria (no afecta al afiliador).
      await signOut(secondaryAuth);

      Swal.fire({
        title: '¡Concierge afiliado!',
        text: `Se registró a ${formData.name} y se le envió un correo para crear su contraseña.`,
        icon: 'success',
        confirmButtonColor: '#007bff',
      });

      setFormData(initialState);
      if (onAffiliated) onAffiliated();
    } catch (error) {
      console.error('Error al afiliar concierge:', error);
      let message = 'Hubo un problema al afiliar al concierge.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Ese correo ya está registrado en el sistema.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'El correo no es válido.';
      }
      Swal.fire('Error', message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Afiliar Nuevo Concierge">
      <form onSubmit={handleSubmit} className="affiliate-form">
        <div className="form-row">
          <Input label="Nombre completo" id="name" value={formData.name} onChange={handleChange} required />
          <Input label="Email" id="email" type="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <Input label="Hotel / Propiedad" id="hotel" value={formData.hotel} onChange={handleChange} required />
          <Input label="Teléfono / WhatsApp" id="phone" value={formData.phone} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>Afiliado por</label>
          <input type="text" value={user?.email || ''} disabled />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Afiliando...' : 'Afiliar Concierge'}
        </Button>
      </form>
    </Card>
  );
};

export default AffiliateForm;
