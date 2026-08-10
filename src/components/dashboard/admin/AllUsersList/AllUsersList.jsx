'use client';
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Card from '@/components/ui/Card/Card';
import './AllUsersList.css';

const ROLE_LABELS = {
  vendedor: 'Vendedor / Concierge',
  cajera: 'Cajera',
  afiliador: 'Afiliador',
  admin: 'Administración',
  owner: 'Dueño',
};

// Lista, en tiempo real, a todos los usuarios del sistema (cualquier rol).
const AllUsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td data-label="Nombre">{u.name || '-'}</td>
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Rol">
                    <span className={`role-badge role-${u.role}`}>{ROLE_LABELS[u.role] || u.role || '-'}</span>
                  </td>
                  <td data-label="Tel.">{u.phone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default AllUsersList;
