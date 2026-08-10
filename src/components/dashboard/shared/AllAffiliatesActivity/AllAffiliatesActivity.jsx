'use client';
import React, { useMemo, useState } from 'react';
import { useConcierges } from '@/hooks/useCommissionData';
import { getCommissionWeek, shiftCommissionWeek, formatWeekLabel, formatShortDate, formatDateStr } from '@/utils/commissionWeek';
import Card from '@/components/ui/Card/Card';
import './AllAffiliatesActivity.css';

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Para Owner/Admin: cuántos concierges afilió CADA afiliador, día por día,
// en la semana seleccionada -- el mismo tipo de vista que "Mi Actividad"
// del afiliador, pero de todos a la vez.
const AllAffiliatesActivity = () => {
  const { concierges, loading } = useConcierges(); // todos los usuarios con rol vendedor
  const [weekStart, setWeekStart] = useState(() => getCommissionWeek().startDate);

  const week = useMemo(() => getCommissionWeek(weekStart), [weekStart]);
  const todayStr = useMemo(() => formatDateStr(new Date()), []);

  const goPrevWeek = () => setWeekStart((prev) => shiftCommissionWeek(prev, -1).startDate);
  const goNextWeek = () => setWeekStart((prev) => shiftCommissionWeek(prev, 1).startDate);
  const goCurrentWeek = () => setWeekStart(getCommissionWeek().startDate);

  const conciergeDateStr = (c) => (c.createdAt?.toDate ? formatDateStr(c.createdAt.toDate()) : null);

  const days = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(week.startDate);
      d.setDate(d.getDate() + i);
      arr.push({ dateStr: formatDateStr(d), label: formatShortDate(d), dow: DAY_LABELS[d.getDay()] });
    }
    return arr;
  }, [week]);

  const rows = useMemo(() => {
    const map = new Map(); // afiliadorKey -> { key, email, perDay, weekTotal, allTime }
    concierges.forEach((c) => {
      const key = c.affiliatedByUid || 'none';
      const email = c.affiliatedByEmail || 'Sin afiliador registrado';
      if (!map.has(key)) {
        map.set(key, { key, email, perDay: {}, weekTotal: 0, allTime: 0 });
      }
      const row = map.get(key);
      row.allTime += 1;

      const dStr = conciergeDateStr(c);
      if (dStr && dStr >= week.startStr && dStr <= week.endStr) {
        row.perDay[dStr] = (row.perDay[dStr] || 0) + 1;
        row.weekTotal += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.weekTotal - a.weekTotal);
  }, [concierges, week]);

  const grandWeekTotal = rows.reduce((sum, r) => sum + r.weekTotal, 0);

  return (
    <Card title="Afiliaciones por Día (Todos los Afiliadores)">
      <div className="week-nav">
        <button onClick={goPrevWeek} aria-label="Semana anterior">←</button>
        <div className="week-nav__label">
          <strong>{formatWeekLabel(week)}</strong>
        </div>
        <button onClick={goNextWeek} aria-label="Semana siguiente">→</button>
        <button className="week-nav__today" onClick={goCurrentWeek}>Hoy</button>
      </div>

      {loading ? (
        <p className="report-empty">Cargando...</p>
      ) : rows.length === 0 ? (
        <p className="report-empty">Todavía no hay concierges afiliados.</p>
      ) : (
        <div className="table-container">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Afiliador</th>
                {days.map((d) => (
                  <th key={d.dateStr} className={d.dateStr === todayStr ? 'is-today' : ''}>
                    {d.dow}<br /><span>{d.label}</span>
                  </th>
                ))}
                <th>Semana</th>
                <th>Histórico</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td data-label="Afiliador"><strong>{row.email}</strong></td>
                  {days.map((d) => (
                    <td key={d.dateStr} data-label={`${d.dow} ${d.label}`} className={d.dateStr === todayStr ? 'is-today' : ''}>
                      {row.perDay[d.dateStr] || 0}
                    </td>
                  ))}
                  <td data-label="Total Semana"><strong>{row.weekTotal}</strong></td>
                  <td data-label="Total Histórico">{row.allTime}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                {days.map((d) => {
                  const dayTotal = rows.reduce((sum, r) => sum + (r.perDay[d.dateStr] || 0), 0);
                  return <td key={d.dateStr}>{dayTotal}</td>;
                })}
                <td>{grandWeekTotal}</td>
                <td>-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
};

export default AllAffiliatesActivity;
