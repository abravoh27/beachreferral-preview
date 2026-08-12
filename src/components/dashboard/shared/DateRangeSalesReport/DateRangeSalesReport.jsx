'use client';
import React, { useMemo, useState } from 'react';
import { useCompletedSales, useConcierges } from '@/hooks/useCommissionData';
import { formatDateStr } from '@/utils/commissionWeek';
import Card from '@/components/ui/Card/Card';
import './DateRangeSalesReport.css';

const PAX_RATE = 50; // comisión por persona que llegó, para el afiliador correspondiente

const getMonthStartStr = () => {
  const d = new Date();
  d.setDate(1);
  return formatDateStr(d);
};
const getTodayStr = () => formatDateStr(new Date());

// Reporte flexible por rango de fechas para el dueño: cuánto se vendió,
// desglosado por concierge (cuántos mandó cada uno) y por afiliador
// (cuánto le corresponde de comisión). Solo cuenta ventas con llegada
// confirmada (status: Completed) -- lo mismo que ya usa "Ganancia Total"
// en el resumen financiero.
const DateRangeSalesReport = () => {
  const { sales, loading: loadingSales } = useCompletedSales();
  const { concierges, loading: loadingConcierges } = useConcierges();
  const [startDate, setStartDate] = useState(getMonthStartStr());
  const [endDate, setEndDate] = useState(getTodayStr());

  const loading = loadingSales || loadingConcierges;

  const conciergeById = useMemo(() => {
    const map = new Map();
    concierges.forEach((c) => map.set(c.id, c));
    return map;
  }, [concierges]);

  const filteredSales = useMemo(
    () => sales.filter((s) => s.date && s.date >= startDate && s.date <= endDate),
    [sales, startDate, endDate]
  );

  const conciergeRows = useMemo(() => {
    const map = new Map();
    filteredSales.forEach((sale) => {
      const key = sale.sellerId || sale.sellerEmail || 'desconocido';
      if (!map.has(key)) {
        const concierge = conciergeById.get(sale.sellerId);
        map.set(key, {
          key,
          name: concierge?.name || sale.sellerEmail || 'Desconocido',
          hotel: concierge?.hotel || '',
          afiliadorEmail: concierge?.affiliatedByEmail || 'Sin afiliador',
          visits: 0,
          pax: 0,
          revenue: 0,
        });
      }
      const row = map.get(key);
      row.visits += 1;
      row.pax += parseInt(sale.quantity) || 0;
      row.revenue += parseFloat(sale.totalAmount || sale.amount || 0);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, conciergeById]);

  const afiliadorRows = useMemo(() => {
    const map = new Map();
    conciergeRows.forEach((row) => {
      const key = row.afiliadorEmail;
      if (!map.has(key)) map.set(key, { key, email: key, pax: 0 });
      map.get(key).pax += row.pax;
    });
    return Array.from(map.values())
      .map((a) => ({ ...a, commission: a.pax * PAX_RATE }))
      .sort((a, b) => b.commission - a.commission);
  }, [conciergeRows]);

  const totalRevenue = filteredSales.reduce((sum, s) => sum + (parseFloat(s.totalAmount || s.amount) || 0), 0);
  const totalPax = filteredSales.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0);

  const applyPreset = (preset) => {
    const today = new Date();
    if (preset === 'week') {
      const dow = today.getDay();
      const daysSinceMonday = (dow + 6) % 7;
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysSinceMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      setStartDate(formatDateStr(monday));
      setEndDate(formatDateStr(sunday));
    } else if (preset === 'month') {
      setStartDate(getMonthStartStr());
      setEndDate(getTodayStr());
    } else if (preset === 'all') {
      setStartDate('2000-01-01');
      setEndDate('2100-01-01');
    }
  };

  return (
    <Card title="Reporte por Periodo">
      <div className="range-controls">
        <div className="range-field">
          <label>Desde</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="range-field">
          <label>Hasta</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="range-presets">
          <button onClick={() => applyPreset('week')}>Esta Semana (Lun-Dom)</button>
          <button onClick={() => applyPreset('month')}>Este Mes</button>
          <button onClick={() => applyPreset('all')}>Todo</button>
        </div>
      </div>

      {loading ? (
        <p className="range-empty">Cargando...</p>
      ) : (
        <>
          <div className="range-summary">
            <div className="range-summary__card">
              <span className="range-summary__value">${totalRevenue.toLocaleString()}</span>
              <span className="range-summary__label">Vendido (Aprobado)</span>
            </div>
            <div className="range-summary__card">
              <span className="range-summary__value">{totalPax}</span>
              <span className="range-summary__label">Personas</span>
            </div>
            <div className="range-summary__card">
              <span className="range-summary__value">{filteredSales.length}</span>
              <span className="range-summary__label">Reservas</span>
            </div>
          </div>

          <h4 className="range-subtitle">Desglose por Concierge</h4>
          {conciergeRows.length === 0 ? (
            <p className="range-empty">Sin datos en este periodo.</p>
          ) : (
            <div className="table-container">
              <table className="range-table">
                <thead>
                  <tr>
                    <th>Concierge</th>
                    <th>Hotel</th>
                    <th>Afiliador</th>
                    <th>Visitas</th>
                    <th>Pax</th>
                    <th>Vendido</th>
                  </tr>
                </thead>
                <tbody>
                  {conciergeRows.map((row) => (
                    <tr key={row.key}>
                      <td data-label="Concierge">{row.name}</td>
                      <td data-label="Hotel">{row.hotel || '-'}</td>
                      <td data-label="Afiliador">{row.afiliadorEmail}</td>
                      <td data-label="Visitas">{row.visits}</td>
                      <td data-label="Pax">{row.pax}</td>
                      <td data-label="Vendido">${row.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h4 className="range-subtitle">Desglose por Afiliador (Comisión)</h4>
          {afiliadorRows.length === 0 ? (
            <p className="range-empty">Sin datos en este periodo.</p>
          ) : (
            <div className="table-container">
              <table className="range-table">
                <thead>
                  <tr>
                    <th>Afiliador</th>
                    <th>Pax</th>
                    <th>Comisión ($50/pax)</th>
                  </tr>
                </thead>
                <tbody>
                  {afiliadorRows.map((row) => (
                    <tr key={row.key}>
                      <td data-label="Afiliador">{row.email}</td>
                      <td data-label="Pax">{row.pax}</td>
                      <td data-label="Comisión">${row.commission.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default DateRangeSalesReport;
