'use client';
import React, { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompletedSales, useConcierges } from '@/hooks/useCommissionData';
import { useWeeklyPayments, setWeeklyPaymentStatus } from '@/hooks/useWeeklyPayments';
import { getCommissionWeek, shiftCommissionWeek, formatWeekLabel, formatShortDate } from '@/utils/commissionWeek';
import Swal from 'sweetalert2';
import Card from '@/components/ui/Card/Card';
import './AffiliateCommissionReport.css';

// $ que se le paga al afiliador por cada persona que llegó al Beach Club
// (referida por alguno de los concierges que él registró).
const PAX_RATE = 50;

// scope="own"  -> el afiliador ve solo lo suyo (dashboard de Afiliador)
// scope="all"  -> ve a todos los afiliadores agrupados (Admin / Owner)
const AffiliateCommissionReport = ({ scope = 'own' }) => {
  const { user } = useAuth();
  const { sales, loading: loadingSales } = useCompletedSales();
  const { concierges, loading: loadingConcierges } = useConcierges();
  const [weekStart, setWeekStart] = useState(() => getCommissionWeek().startDate);
  const [updatingUid, setUpdatingUid] = useState(null);

  const week = useMemo(() => getCommissionWeek(weekStart), [weekStart]);
  const { payments } = useWeeklyPayments(week.startStr);
  const loading = loadingSales || loadingConcierges;

  const goPrevWeek = () => setWeekStart((prev) => shiftCommissionWeek(prev, -1).startDate);
  const goNextWeek = () => setWeekStart((prev) => shiftCommissionWeek(prev, 1).startDate);
  const goCurrentWeek = () => setWeekStart(getCommissionWeek().startDate);

  // Mapa concierge.id (uid) -> doc del concierge, para saber quién lo afilió
  const conciergeById = useMemo(() => {
    const map = new Map();
    concierges.forEach((c) => map.set(c.id, c));
    return map;
  }, [concierges]);

  // Agrupa las llegadas de la semana seleccionada: afiliador -> concierge -> pax
  const groups = useMemo(() => {
    const weekSales = sales.filter((s) => s.date && s.date >= week.startStr && s.date <= week.endStr);
    const groupsMap = new Map();

    weekSales.forEach((sale) => {
      const concierge = conciergeById.get(sale.sellerId);
      const afiliadorUid = concierge?.affiliatedByUid || 'none';
      const afiliadorEmail = concierge?.affiliatedByEmail || 'Sin afiliador registrado';
      const pax = parseInt(sale.quantity) || 0;

      if (!groupsMap.has(afiliadorUid)) {
        groupsMap.set(afiliadorUid, { afiliadorUid, afiliadorEmail, concierges: new Map(), totalPax: 0 });
      }
      const group = groupsMap.get(afiliadorUid);
      group.totalPax += pax;

      const conciergeKey = sale.sellerId || sale.sellerEmail || 'desconocido';
      if (!group.concierges.has(conciergeKey)) {
        group.concierges.set(conciergeKey, {
          name: concierge?.name || sale.sellerEmail || 'Concierge desconocido',
          email: concierge?.email || sale.sellerEmail || '',
          hotel: concierge?.hotel || '',
          pax: 0,
          visits: 0,
        });
      }
      const cData = group.concierges.get(conciergeKey);
      cData.pax += pax;
      cData.visits += 1;
    });

    return groupsMap;
  }, [sales, week, conciergeById]);

  const visibleGroups = useMemo(() => {
    const all = Array.from(groups.values());
    if (scope === 'own') {
      const mine = all.find((g) => g.afiliadorUid === user?.uid);
      return mine ? [mine] : [];
    }
    return all.sort((a, b) => b.totalPax - a.totalPax);
  }, [groups, scope, user]);

  const grandTotalPax = visibleGroups.reduce((sum, g) => sum + g.totalPax, 0);
  const grandTotalPay = grandTotalPax * PAX_RATE;

  const handleTogglePaid = async (group) => {
    if (group.afiliadorUid === 'none') return; // no hay a quién marcarle el pago
    const current = payments[group.afiliadorUid];
    const nextPaid = !current?.paid;

    setUpdatingUid(group.afiliadorUid);
    try {
      await setWeeklyPaymentStatus({
        afiliadorUid: group.afiliadorUid,
        afiliadorEmail: group.afiliadorEmail,
        week,
        paid: nextPaid,
        totalPax: group.totalPax,
        totalAmount: group.totalPax * PAX_RATE,
        markedBy: user,
      });
    } catch (error) {
      console.error('Error al actualizar estado de pago:', error);
      Swal.fire('Error', 'No se pudo actualizar el estado de pago.', 'error');
    } finally {
      setUpdatingUid(null);
    }
  };

  return (
    <Card title={scope === 'own' ? 'Mi Reporte Semanal' : 'Reporte Semanal de Afiliados'}>
      <p className="cycle-note">
        Ciclo: Lunes a Domingo. El reporte cierra el domingo y se paga el <strong>Miércoles</strong> siguiente.
      </p>
      <div className="week-nav">
        <button onClick={goPrevWeek} aria-label="Semana anterior">←</button>
        <div className="week-nav__label">
          <strong>{formatWeekLabel(week)}</strong>
          <span className="week-nav__pay">Se paga el {formatShortDate(week.payDate)}</span>
        </div>
        <button onClick={goNextWeek} aria-label="Semana siguiente">→</button>
        <button className="week-nav__today" onClick={goCurrentWeek}>Hoy</button>
      </div>

      {loading ? (
        <p className="report-empty">Cargando...</p>
      ) : visibleGroups.length === 0 ? (
        <p className="report-empty">
          {scope === 'own'
            ? 'Ninguno de tus concierges tuvo llegadas confirmadas esta semana.'
            : 'No hay llegadas confirmadas esta semana.'}
        </p>
      ) : (
        <>
          {visibleGroups.map((group) => {
            const isPaid = !!payments[group.afiliadorUid]?.paid;
            return (
              <div key={group.afiliadorUid} className="affiliate-group">
                <div className="affiliate-group__header">
                  {scope === 'all' && <span className="affiliate-group__name">{group.afiliadorEmail}</span>}
                  <span className="affiliate-group__total">
                    {group.totalPax} pax · ${(group.totalPax * PAX_RATE).toLocaleString()}
                  </span>
                  {group.afiliadorUid !== 'none' && (
                    <button
                      className={`paid-toggle ${isPaid ? 'is-paid' : ''}`}
                      onClick={() => handleTogglePaid(group)}
                      disabled={updatingUid === group.afiliadorUid}
                    >
                      {isPaid ? '✅ Cobrado' : 'Marcar como cobrado'}
                    </button>
                  )}
                </div>
                <div className="table-container">
                  <table className="commission-table">
                    <thead>
                      <tr>
                        <th>Concierge</th>
                        <th>Hotel</th>
                        <th>Visitas</th>
                        <th>Pax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(group.concierges.values()).map((c) => (
                        <tr key={c.email || c.name}>
                          <td data-label="Concierge">{c.name}</td>
                          <td data-label="Hotel">{c.hotel || '-'}</td>
                          <td data-label="Visitas">{c.visits}</td>
                          <td data-label="Pax">{c.pax}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          <div className="report-total">
            <span>Total: {grandTotalPax} persona{grandTotalPax === 1 ? '' : 's'} llegaron</span>
            <span className="report-total__amount">${grandTotalPay.toLocaleString()}</span>
          </div>
        </>
      )}
    </Card>
  );
};

export default AffiliateCommissionReport;
