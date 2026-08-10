'use client';
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Card from '@/components/ui/Card/Card';
import Modal from '@/components/ui/Modal/Modal';
import Button from '@/components/ui/Button/Button';
import './TopSellersList.css';
import DateRangeIcon from '@mui/icons-material/DateRange';
const TopSellersList = () => {
  const [topSellers, setTopSellers] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'day', 'week', 'month', 'all'

  // Estados para el Modal y Paginación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Suscripción en tiempo real a todas las ventas
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "sales"),
      (querySnapshot) => {
        const salesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllSales(salesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error obteniendo datos:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Filtrar y Agrupar
  useEffect(() => {
    const processSellers = () => {
      const now = new Date();

      // Paso A: Filtrar ventas por fecha y SOLAMENTE APROBADAS
      const filteredSales = allSales.filter(sale => {
        // Condición crítica: Solo ventas completadas/aprobadas
        if (sale.status !== 'Completed') return false;

        if (!sale.date) return false;
        const saleDate = new Date(sale.date + 'T00:00:00');

        if (filter === 'all') return true;
        if (filter === 'day') return saleDate.toDateString() === now.toDateString();
        if (filter === 'week') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0,0,0,0);
            return saleDate >= startOfWeek;
        }
        if (filter === 'month') {
            return saleDate.getMonth() === now.getMonth() && 
                   saleDate.getFullYear() === now.getFullYear();
        }
        return true;
      });

      // Paso B: Agrupar por vendedor
      const sellerMap = {};
      filteredSales.forEach((data) => {
        // Usamos quantity (Pax) en lugar de amount
        const quantity = parseInt(data.quantity) || 0; 
        const email = data.sellerEmail || 'Desconocido';

        if (!sellerMap[email]) {
          sellerMap[email] = {
            email: email,
            totalQuantity: 0,
            sales: [] // Guardamos las ventas individuales para el popup
          };
        }
        sellerMap[email].totalQuantity += quantity;
        sellerMap[email].sales.push(data);
      });

      // Paso C: Ordenar por Cantidad Total y cortar Top 5
      const sortedSellers = Object.values(sellerMap)
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 5);

      setTopSellers(sortedSellers);
    };

    processSellers();
  }, [filter, allSales]);

  // Manejo del Modal
  const handleSellerClick = (seller) => {
    setSelectedSeller(seller);
    setCurrentPage(1); // Resetear a página 1 al abrir
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSeller(null);
  };

  // Lógica de Paginación para el Modal
  const getPaginatedSales = () => {
    if (!selectedSeller) return [];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return selectedSeller.sales.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const totalPages = selectedSeller ? Math.ceil(selectedSeller.sales.length / ITEMS_PER_PAGE) : 0;

  if (loading) return <Card title="Top Vendedores"><div>Cargando...</div></Card>;

  return (
    <>
      <Card title="Mejores Vendedores (Pax Aprobados)">
         {/* Botones de Filtro */}
         <div className="filter-buttons" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}>
          <button onClick={() => setFilter('day')} disabled={filter === 'day'} style={{ fontWeight: filter === 'day' ? 'bold' : 'normal' }}>Hoy</button>
          <button onClick={() => setFilter('week')} disabled={filter === 'week'} style={{ fontWeight: filter === 'week' ? 'bold' : 'normal' }}>Semana</button>
          <button onClick={() => setFilter('month')} disabled={filter === 'month'} style={{ fontWeight: filter === 'month' ? 'bold' : 'normal' }}>Mes</button>
          <button onClick={() => setFilter('all')} disabled={filter === 'all'} style={{ fontWeight: filter === 'all' ? 'bold' : 'normal' }}><DateRangeIcon/></button>
        </div>

        <ul>
          {topSellers.map((seller, index) => (
            <li 
              key={index} 
              onClick={() => handleSellerClick(seller)}
              className="seller-row"
            >
              <span>{index + 1}. {seller.email}</span>
              {/* Mostramos Cantidad Total (Pax) */}
              <strong>{seller.totalQuantity} Pax</strong>
            </li>
          ))}
          {topSellers.length === 0 && <li style={{color: '#888', fontStyle: 'italic'}}>No hubo ventas aprobadas en este periodo.</li>}
        </ul>
      </Card>

      {/* Modal con Lista de Ventas Paginada */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Ventas de ${selectedSeller?.email?.split('@')[0]}`}>
        <div className="modal-sales-list">
            <table className="detail-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Ciudad</th>
                        <th>Pax</th>
                        <th>Reserva</th>
                    </tr>
                </thead>
                <tbody>
                    {getPaginatedSales().map((sale) => (
                        <tr key={sale.id}>
                            <td>{sale.date}</td>
                            <td>{sale.city}</td>
                            <td style={{fontWeight: 'bold'}}>{sale.quantity}</td>
                            <td style={{fontSize: '0.85rem'}}>{sale.reservationFor || 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Controles de Paginación */}
            {totalPages > 1 && (
                <div className="pagination-controls">
                    <Button 
                        variant="secondary" 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Anterior
                    </Button>
                    <span className="page-indicator">Página {currentPage} de {totalPages}</span>
                    <Button 
                        variant="secondary" 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Siguiente
                    </Button>
                </div>
            )}
        </div>
      </Modal>
    </>
  );
};

export default TopSellersList;