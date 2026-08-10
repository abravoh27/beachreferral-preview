'use client';
import React, { useEffect, useState } from 'react';
import { collection, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Swal from 'sweetalert2';
import Card from '@/components/ui/Card/Card';
import './AllUsersList.css';

const ROLE_LABELS = {
  vendedor: 'Vendedor / Concierge',
  cajera: 'Cajera',
  afiliador: 'Afiliador',
  admin: 'Administración',
  owner: 'Dueño',
};

// Solo estos roles se pueden activar/desactivar desde aquí (los que Admin
// da de alta directamente). Vendedor/Admin/Owner no tienen este control
// por ahora, para evitar que alguien se bloquee a sí mismo o a otro admin.
const DEACTIVATABLE_ROLES = ['cajera', 'afiliador'];

// Lista, en tiempo real, a todos los usuarios del sistema (cualquier rol).
const AllUsersList = () => {
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

  return (
    <Card title={`Usuarios del Sistema (${users.length})`}>
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
                <th>Tel.</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isActive = u.active !== false;
                const canToggle = DEACTIVATABLE_ROLES.includes(u.role);
                return (
                  <tr key={u.id}>
                    <td data-label="Nombre">{u.name || '-'}</td>
                    <td data-label="Email">{u.email}</td>
                    <td data-label="Rol">
                      <span className={`role-badge role-${u.role}`}>{ROLE_LABELS[u.role] || u.role || '-'}</span>
                    </td>
                    <td data-label="Tel.">{u.phone || '-'}</td>
                    <td data-label="Estado">
                      <span className={`status-badge ${isActive ? 'is-active' : 'is-inactive'}`}>
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td data-label="Acción">
                      {canToggle && (
                        <button
                          className={`toggle-active-btn ${isActive ? '' : 'is-reactivate'}`}
                          onClick={() => handleToggleActive(u)}
                          disabled={updatingId === u.id}
                        >
                          {isActive ? 'Desactivar' : 'Reactivar'}
                        </button>
                      )}
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
