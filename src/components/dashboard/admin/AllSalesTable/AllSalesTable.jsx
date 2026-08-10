/* File: src/components/dashboard/admin/AllSalesTable/AllSalesTable.jsx
   Type: uploaded file modification
*/
'use client';
import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Card from '@/components/ui/Card/Card';
import SaleDetailModal from '../SaleDetailModal/SaleDetailModal';
import './AllSalesTable.css';

const AllSalesTable = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);

  // Filtros
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Suscripción en tiempo real: se actualiza sola apenas un concierge
  // registra una venta o la cajera/admin la modifica, sin recargar la página.
  useEffect(() => {
    const q = query(collection(db, "sales"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const salesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSales(salesData);
      },
      (error) => {
        console.error("Error cargando ventas:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Lógica de Filtrado 
  useEffect(() => {
    let result = [...sales];
    const now = new Date();

    if (dateFilter !== 'all') {
      result = result.filter(sale => {
        if (!sale.date) return false;
        const saleDate = new Date(sale.date + 'T00:00:00');
        
        if (dateFilter === 'day') return saleDate.toDateString() === now.toDateString();
        if (dateFilter === 'week') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return saleDate >= startOfWeek;
        }
        if (dateFilter === 'month') {
          return saleDate.getMonth() === now.getMonth() && 
                 saleDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    if (statusFilter !== 'all') {
      result = result.filter(sale => sale.status === statusFilter);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(sale => 
        (sale.sellerEmail && sale.sellerEmail.toLowerCase().includes(term)) ||
        (sale.reservationFor && sale.reservationFor.toLowerCase().includes(term)) || // Ahora busca por nombre de reserva
        (sale.folio && sale.folio.toString().includes(term))
      );
    }

    setFilteredSales(result);
  }, [sales, dateFilter, statusFilter, searchTerm]);

  // Helpers
  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed': return 'status-completed';
      case 'Pending': return 'status-pending';
      case 'Cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  const formatStatus = (status) => {
    if (status === 'Completed') return 'Aprobada';
    if (status === 'Pending') return 'En Espera';
    if (status === 'Cancelled') return 'Cancelada';
    return status;
  }

  const formatName = (email) => email ? email.split('@')[0] : 'N/A';

  const handleRowClick = (sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSale(null);
  };

  return (
    <>
      <Card title="Gestión de Ventas">
          {/* --- BARRA DE FILTROS --- */}
          <div className="filters-container">
            <div className="filter-group date-buttons">
                <button onClick={() => setDateFilter('day')} className={dateFilter === 'day' ? 'active' : ''}>Hoy</button>
                <button onClick={() => setDateFilter('week')} className={dateFilter === 'week' ? 'active' : ''}>Semana</button>
                <button onClick={() => setDateFilter('month')} className={dateFilter === 'month' ? 'active' : ''}>Mes</button>
                <button onClick={() => setDateFilter('all')} className={dateFilter === 'all' ? 'active' : ''}>Todo</button>
            </div>

            <div className="filter-group inputs">
                <input 
                  type="text" 
                  placeholder="Buscar vendedor, cliente o folio..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="status-select"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="Pending">En Espera</option>
                  <option value="Completed">Aprobada</option>
                  <option value="Cancelled">Cancelada</option>
                </select>
            </div>
          </div>

          <div className="table-container">
              <table className="sales-table">
                  <thead>
                      <tr>
                          <th>Vendedor / Reserva</th>
                          <th>Detalles</th>
                          <th>Monto</th>
                          <th>Estado</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filteredSales.map((sale) => (
                          <tr key={sale.id} onClick={() => handleRowClick(sale)} className="clickable-row">
                              <td data-label="Vendedor">
                                  <div className="seller-info">
                                      <span className="seller-name">{formatName(sale.sellerEmail)}</span>
                                      {/* Aquí mostramos Reservation For en lugar de Referred By */}
                                      <span className="referred-by" style={{color: '#555', fontSize: '0.85rem'}}>
                                        Reserva: <strong>{sale.reservationFor || 'N/A'}</strong>
                                      </span>
                                  </div>
                              </td>
                              <td data-label="Detalles">
                                <div style={{fontSize: '0.85rem'}}>
                                    <div>{sale.date}</div>
                                    {sale.folio && <div style={{fontWeight:'bold', color: '#555'}}>Folio: {sale.folio}</div>}
                                </div>
                              </td>
                              <td data-label="Monto" className="amount-cell">
                                  ${parseFloat(sale.totalAmount || sale.amount).toLocaleString()}
                              </td>
                              <td data-label="Estado">
                                  <span className={`status-badge ${getStatusClass(sale.status)}`}>
                                      {formatStatus(sale.status)}
                                  </span>
                              </td>
                          </tr>
                      ))}
                      {filteredSales.length === 0 && (
                        <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem', color: '#888'}}>No se encontraron ventas.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </Card>

      {/* Ya no hace falta refetch manual (onUpdate): la suscripción de arriba actualiza sola. */}
      <SaleDetailModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        sale={selectedSale}
      />
    </>
  );
};
export default AllSalesTable;