'use client';
import React, { useEffect, useState } from 'react';
import { collection, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import * as XLSX from 'xlsx';
import { db } from '@/lib/firebase';
import { secondaryAuth } from '@/lib/firebaseSecondary';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import Card from '@/components/ui/Card/Card';
import Button from '@/components/ui/Button/Button';
import './AllUsersList.css';

const ROLE_LABELS = {
  vendedor: 'Vendedor / Concierge',
  cajera: 'Cajera',
  afiliador: 'Afiliador',
  admin: 'Administración',
  owner: 'Dueño',
};

// Solo estos roles se pueden activar/desactivar/eliminar desde aquí (los
// que Admin da de alta directamente). Vendedor/Admin/Owner no tienen este
// control por ahora, para evitar que alguien se bloquee a sí mismo o a
// otro admin, o borre por accidente el historial de un concierge.
const DEACTIVATABLE_ROLES = ['cajera', 'afiliador'];

// Lista, en tiempo real, a todos los usuarios del sistema (cualquier rol).
const AllUsersList = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setUsers(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error cargando usuarios:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleToggleActive = async (targetUser) => {
    const isActive = targetUser.active !== false;
    const action = isActive ? 'desactivar' : 'reactivar';

    const { isConfirmed } = await Swal.fire({
      title: `¿${isActive ? 'Desactivar' : 'Reactivar'} a ${targetUser.name || targetUser.email}?`,
      text: isActive
        ? 'Esta persona ya no podrá entrar al sistema hasta que lo reactives.'
        : 'Esta persona podrá volver a entrar al sistema con su cuenta.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: isActive ? '#dc3545' : '#007bff',
    });
    if (!isConfirmed) return;

    setUpdatingId(targetUser.id);
    try {
      await updateDoc(doc(db, 'users', targetUser.id), { active: !isActive });
      Swal.fire({
        title: isActive ? 'Usuario desactivado' : 'Usuario reactivado',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      Swal.fire('Error', 'No se pudo actualizar el usuario.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResendEmail = async (targetUser) => {
    setUpdatingId(targetUser.id);
    try {
      await sendPasswordResetEmail(secondaryAuth, targetUser.email);
      Swal.fire({
        title: 'Correo reenviado',
        text: `Se le mandó a ${targetUser.email} un link para crear/cambiar su contraseña.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al reenviar correo:', error);
      let message = 'No se pudo reenviar el correo.';
      if (error.code === 'auth/user-not-found') {
        message = 'Esta cuenta ya no existe en Firebase Auth (puede que se haya eliminado antes).';
      }
      Swal.fire('Error', message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (targetUser) => {
    const { isConfirmed } = await Swal.fire({
      title: `¿Eliminar a ${targetUser.name || targetUser.email}?`,
      html: `Esto borra <strong>por completo</strong> su cuenta (login y perfil). Su correo <strong>${targetUser.email}</strong> queda libre para volver a usarse. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar definitivamente',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    });
    if (!isConfirmed) return;

    setUpdatingId(targetUser.id);
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ uid: targetUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido');

      Swal.fire({ title: 'Usuario eliminado', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      Swal.fire('Error', error.message || 'No se pudo eliminar el usuario.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkResend = async () => {
    const targets = users.filter((u) => u.role === 'vendedor' && u.active !== false);
    if (targets.length === 0) {
      Swal.fire('Sin cuentas', 'No hay Vendedores/Concierge activos para notificar.', 'info');
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: `¿Reenviar correo a ${targets.length} Vendedores/Concierge?`,
      text: 'A cada uno le llega un link para crear o cambiar su contraseña.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, reenviar a todos',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;

    setUpdatingId('bulk');
    let sent = 0;
    let failed = 0;
    for (const target of targets) {
      try {
        await sendPasswordResetEmail(secondaryAuth, target.email);
        sent += 1;
      } catch (error) {
        console.error(`Error reenviando a ${target.email}:`, error);
        failed += 1;
      }
    }
    setUpdatingId(null);

    Swal.fire({
      title: 'Listo',
      text: `Se mandaron ${sent} correos.${failed > 0 ? ` ${failed} fallaron (cuentas ya eliminadas de Auth, probablemente).` : ''}`,
      icon: failed > 0 ? 'warning' : 'success',
    });
  };

  const handleExport = () => {
    const rows = users.map((u) => ({
      Nombre: u.name || '',
      Email: u.email || '',
      Rol: ROLE_LABELS[u.role] || u.role || '',
      Hotel: u.hotel || '',
      Teléfono: u.phone || '',
      Estado: u.active !== false ? 'Activo' : 'Inactivo',
      'Afiliado por': u.affiliatedByEmail || '',
      'Creado por': u.createdByEmail || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, `Usuarios_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <Card
      title={`Usuarios del Sistema (${users.length})`}
      headerAction={
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={handleBulkResend} disabled={updatingId === 'bulk'}>
            {updatingId === 'bulk' ? 'Enviando...' : '📧 Reenviar a todos (Vendedores)'}
          </Button>
          <Button variant="secondary" onClick={handleExport} disabled={users.length === 0}>
            📥 Exportar Excel
          </Button>
        </div>
      }
    >
      {loading ? (
        <p className="users-list-empty">Cargando...</p>
      ) : users.length === 0 ? (
        <p className="users-list-empty">No hay usuarios registrados.</p>
      ) : (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Hotel</th>
                <th>Tel.</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isActive = u.active !== false;
                const canManage = DEACTIVATABLE_ROLES.includes(u.role);
                const isBusy = updatingId === u.id;
                return (
                  <tr key={u.id}>
                    <td data-label="Nombre">{u.name || '-'}</td>
                    <td data-label="Email">{u.email}</td>
                    <td data-label="Rol">
                      <span className={`role-badge role-${u.role}`}>{ROLE_LABELS[u.role] || u.role || '-'}</span>
                    </td>
                    <td data-label="Hotel">{u.hotel || '-'}</td>
                    <td data-label="Tel.">{u.phone || '-'}</td>
                    <td data-label="Estado">
                      <span className={`status-badge ${isActive ? 'is-active' : 'is-inactive'}`}>
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td data-label="Acción">
                      <div className="user-actions">
                        {/* Reenviar correo aplica a CUALQUIER rol -- es de bajo riesgo,
                            solo manda un link de contraseña, no cambia nada por sí solo. */}
                        <button className="resend-btn" onClick={() => handleResendEmail(u)} disabled={isBusy}>
                          Reenviar correo
                        </button>
                        {canManage && (
                          <>
                            <button
                              className={`toggle-active-btn ${isActive ? '' : 'is-reactivate'}`}
                              onClick={() => handleToggleActive(u)}
                              disabled={isBusy}
                            >
                              {isActive ? 'Desactivar' : 'Reactivar'}
                            </button>
                            <button className="delete-btn" onClick={() => handleDelete(u)} disabled={isBusy}>
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
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

export default AllUsersList;
