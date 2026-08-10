'use client';
import React, { useMemo } from 'react';
import { useMyConcierges } from '@/hooks/useMyConcierges';
import { getCommissionWeek, formatShortDate, formatDateStr } from '@/utils/commissionWeek';
import Card from '@/components/ui/Card/Card';
import './AffiliateStats.css';

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Info relevante del afiliador, arriba de todo: total de concierges,
// afiliados hoy, afiliados esta semana, y un desglose día por día.
const AffiliateStats = () => {
  const { concierges, loading } = useMyConcierges();

  const week = useMemo(() => getCommissionWeek(), []);
  const todayStr = useMemo(() => formatDateStr(new Date()), []);

  const conciergeDateStr = (c) => (c.createdAt?.toDate ? formatDateStr(c.createdAt.toDate()) : null);

  const total = concierges.length;
  const today = concierges.filter((c) => conciergeDateStr(c) === todayStr).length;
  const thisWeek = concierges.filter((c) => {
    const d = conciergeDateStr(c);
    return d && d >= week.startStr && d <= week.endStr;
  }).length;

  const perDay = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(week.startDate);
      d.setDate(d.getDate() + i);
      const dStr = formatDateStr(d);
      const count = concierges.filter((c) => conciergeDateStr(c) === dStr).length;
      days.push({ dateStr: dStr, label: formatShortDate(d), dow: DAY_LABELS[d.getDay()], count, isToday: dStr === todayStr });
    }
    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concierges, week, todayStr]);

  return (
    <Card title="Mi Actividad">
      {loading ? (
        <p className="stats-empty">Cargando...</p>
      ) : (
        <>
          <div className="stats-cards">
            <div className="stats-card">
              <span className="stats-card__value">{total}</span>
              <span className="stats-card__label">Concierges Totales</span>
            </div>
            <div className="stats-card">
              <span className="stats-card__value">{today}</span>
              <span className="stats-card__label">Afiliados Hoy</span>
            </div>
            <div className="stats-card">
              <span className="stats-card__value">{thisWeek}</span>
              <span className="stats-card__label">Afiliados esta Semana</span>
            </div>
          </div>

          <div className="stats-per-day">
            <span className="stats-per-day__title">Afiliaciones por día (semana {formatShortDate(week.startDate)} – {formatShortDate(week.endDate)})</span>
            <div className="stats-per-day__row">
              {perDay.map((d) => (
                <div key={d.dateStr} className={`stats-day ${d.isToday ? 'is-today' : ''}`}>
                  <span className="stats-day__dow">{d.dow}</span>
                  <span className="stats-day__date">{d.label}</span>
                  <span className="stats-day__count">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default AffiliateStats;
