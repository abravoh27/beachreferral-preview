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
import './CreateUserForm.css';

export const ROLE_OPTIONS = [
  { value: 'cajera', label: 'Cajera (Beach Club)' },
  { value: 'afiliador', label: 'Afiliador' },
];

const initialState = { name: '', email: '', phone: '', role: 'cajera' };

// Genera una contraseña temporal aleatoria. El usuario nunca la ve:
// se le manda un correo de "restablecer contraseña" para que defina la suya.
const generateTempPassword = () =>
  Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

// Permite a Admin crear cuentas de Cajera y Afiliador sin depender de
// Firebase Console. (Vendedor/Admin/Owner se manejan por otra vía.)
const CreateUserForm = ({ onCreated }) => {
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
      //    cerrar la sesión del admin que está creando el usuario.
      const { user: newUser } = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        generateTempPassword()
      );

      // 2. Dar de alta el documento en Firestore con el rol elegido.
      const userDoc = {
        name: formData.name.trim(),
        email,
        phone: formData.phone.trim(),
        role: formData.role,
        createdByUid: user.uid,
        createdByEmail: user.email,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', newUser.uid), userDoc);

      // 3. Enviar correo para que el nuevo usuario defina su propia contraseña.
      await sendPasswordResetEmail(secondaryAuth, email);

      // 4. Cerrar la sesión temporal de la app secundaria (no afecta al admin).
      await signOut(secondaryAuth);

      const roleLabel = ROLE_OPTIONS.find((r) => r.value === formData.role)?.label || formData.role;
      Swal.fire({
        title: '¡Usuario creado!',
        text: `Se registró a ${formData.name} como ${roleLabel}. Se le envió un correo para crear su contraseña.`,
        icon: 'success',
        confirmButtonColor: '#007bff',
      });

      setFormData(initialState);
      if (onCreated) onCreated();
    } catch (error) {
      console.error('Error al crear usuario:', error);
      let message = 'Hubo un problema al crear el usuario.';
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
    <Card title="Crear Usuario (Cajera / Afiliador)">
      <form onSubmit={handleSubmit} className="create-user-form">
        <div className="form-row">
          <Input label="Nombre completo" id="name" value={formData.name} onChange={handleChange} required />
          <Input label="Email" id="email" type="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <Input label="Teléfono / WhatsApp" id="phone" value={formData.phone} onChange={handleChange} required />
          <div className="input-group">
            <label htmlFor="role">Rol</label>
            <select id="role" value={formData.role} onChange={handleChange} required>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Usuario'}
        </Button>
      </form>
    </Card>
  );
};

export default CreateUserForm;
