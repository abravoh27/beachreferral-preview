'use client';
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Card from '@/components/ui/Card/Card';
import './MetricsSummary.css';
import DateRangeIcon from '@mui/icons-material/DateRange';
const MetricsSummary = () => {
  // Cambiamos el estado para reflejar Ganancia Real (Aprobadas) y Por Cobrar (Pendientes)
  const [metrics, setMetrics] = useState({ totalEarned: 0, pending: 0 });
  const [allSales, setAllSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Suscripción en tiempo real a todas las ventas
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "sales"),
      (querySnapshot) => {
        const salesData = querySnapshot.docs.map(doc => doc.data());
        setAllSales(salesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error al obtener ventas:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Recalcular cuando cambia el filtro o llegan datos
  useEffect(() => {
    const filterSales = () => {
      const now = new Date();
      
      const filtered = allSales.filter(sale => {
        if (!sale.date) return false; 
        const saleDate = new Date(sale.date + 'T00:00:00'); 

        if (filter === 'all') return true;

        if (filter === 'day') {
          return saleDate.toDateString() === now.toDateString();
        }

        if (filter === 'week') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay()); 
          startOfWeek.setHours(0, 0, 0, 0);
          return saleDate >= startOfWeek;
        }

        if (filter === 'month') {
          return saleDate.getMonth() === now.getMonth() && 
                 saleDate.getFullYear() === now.getFullYear();
        }

        return true;
      });

      // Calcular métricas sobre el array FILTRADO
      let earnedSum = 0;
      let pendingSum = 0;

      filtered.forEach((sale) => {
        // Usamos totalAmount si existe (editado por admin), sino el amount original
        const amount = parseFloat(sale.totalAmount || sale.amount) || 0;
        
        // Solo sumamos a "Ganancia" si está Aprobada (Completed)
        if (sale.status === 'Completed') {
          earnedSum += amount;
        }
        
        // Sumamos a "Pendiente" si el estado es Pending
        if (sale.status === 'Pending') {
          pendingSum += amount;
        }
      });

      setMetrics({ totalEarned: earnedSum, pending: pendingSum });
    };

    filterSales();
  }, [filter, allSales]);

  if (loading) return <Card title="Métricas"><div>Cargando...</div></Card>;

  return (
    <Card title="Resumen Financiero">
      {/* Botones de Filtro */}
      <div className="filter-buttons" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => setFilter('day')} disabled={filter === 'day'} style={{ fontWeight: filter === 'day' ? 'bold' : 'normal' }}>Hoy</button>
        <button onClick={() => setFilter('week')} disabled={filter === 'week'} style={{ fontWeight: filter === 'week' ? 'bold' : 'normal' }}>Semana</button>
        <button onClick={() => setFilter('month')} disabled={filter === 'month'} style={{ fontWeight: filter === 'month' ? 'bold' : 'normal' }}>Mes</button>
        <button onClick={() => setFilter('all')} disabled={filter === 'all'} style={{ fontWeight: filter === 'all' ? 'bold' : 'normal' }}><DateRangeIcon/></button>
      </div>

      <div className="metrics">
        <div style={{ fontSize:"1rem",color: 'var(--color-success, #28a745)' }}>
          Ganancia Total (Aprobadas):<br/>
          <span style={{fontSize: '1.5rem'}}>${metrics.totalEarned.toLocaleString()}</span>
        </div>
        <div style={{ fontSize:"1rem", color: 'var(--color-warning, #856404)' }}>
          Por Cobrar (En Espera):<br/>
          <span style={{fontSize: '1.5rem'}}>${metrics.pending.toLocaleString()}</span>
        </div>
      </div>
    </Card>
  );
};

export default MetricsSummary;