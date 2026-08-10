'use client';
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { secondaryAuth } from '@/lib/firebaseSecondary';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import './AffiliateForm.css';

const initialState = { name: '', email: '', hotel: '', phone: '' };

// Genera una contraseña temporal aleatoria. El concierge nunca la ve:
// se le manda un correo de "restablecer contraseña" para que defina la suya.
const generateTempPassword = () =>
  Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

// Formulario de una sola columna, estilo "Google Forms".
// variant="standalone" -> trae su propio encabezado grande (usado suelto en una página).
// variant="modal"      -> sin encabezado propio, para usarse dentro del <Modal> (que ya trae título y botón de cerrar).
const AffiliateForm = ({ onAffiliated, variant = 'standalone' }) => {
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
        title: '¡Concierge registrado!',
        text: `Se registró a ${formData.name} y se le envió un correo para crear su contraseña.`,
        icon: 'success',
        confirmButtonColor: '#007bff',
      });

      setFormData(initialState);
      if (onAffiliated) onAffiliated();
    } catch (error) {
      console.error('Error al afiliar concierge:', error);
      let message = 'Hubo un problema al registrar al concierge.';
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

  const isModal = variant === 'modal';

  return (
    <div className={isModal ? 'gform gform--modal' : 'gform'}>
      {!isModal && (
        <div className="gform__header">
          <h1>Registrar Concierge</h1>
          <p>Da de alta a un nuevo concierge en un par de datos. Al enviar el formulario, queda registrado en el sistema y le llega un correo para crear su contraseña.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="gform__form">
        <div className="gform__field">
          <label htmlFor="name">Nombre completo</label>
          <input id="name" type="text" value={formData.name} onChange={handleChange} placeholder="Ej. Juan Pérez" required />
        </div>

        <div className="gform__field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="correo@ejemplo.com" required />
        </div>

        <div className="gform__field">
          <label htmlFor="hotel">Hotel / Propiedad</label>
          <input id="hotel" type="text" value={formData.hotel} onChange={handleChange} placeholder="Ej. Hotel Riviera" required />
        </div>

        <div className="gform__field">
          <label htmlFor="phone">Teléfono / WhatsApp</label>
          <input id="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Ej. 984 123 4567" required />
        </div>

        <div className="gform__field gform__field--readonly">
          <label>Afiliado por</label>
          <input type="text" value={user?.email || ''} disabled />
        </div>

        <button type="submit" className="gform__submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrar Concierge'}
        </button>
      </form>
    </div>
  );
};

export default AffiliateForm;
