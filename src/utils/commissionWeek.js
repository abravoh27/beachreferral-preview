// La "semana de comisión" corre de Sábado a Viernes. El pago se hace el
// Lunes siguiente, para dejar sábado y domingo para juntar el dinero.
// Ej: semana 8-14 (sáb a vie) se paga el 17 (lunes); semana 15-21 se paga el 24.

const toDateOnly = (d) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const formatDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const formatShortDate = (d) => `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;

// Dado cualquier día de referencia, regresa el rango Sábado-Viernes que lo
// contiene, más la fecha de pago (el lunes siguiente al viernes).
export const getCommissionWeek = (referenceDate = new Date()) => {
  const ref = toDateOnly(referenceDate);
  const dow = ref.getDay(); // 0=Domingo ... 6=Sábado
  const daysSinceSaturday = (dow + 1) % 7; // Sábado->0, Domingo->1, Lunes->2 ... Viernes->6

  const start = new Date(ref);
  start.setDate(ref.getDate() - daysSinceSaturday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const payDate = new Date(end);
  payDate.setDate(end.getDate() + 3); // viernes + 3 días = lunes

  return {
    startDate: start,
    endDate: end,
    payDate,
    startStr: formatDateStr(start),
    endStr: formatDateStr(end),
    payStr: formatDateStr(payDate),
  };
};

export const shiftCommissionWeek = (startDate, weeks) => {
  const shifted = new Date(startDate);
  shifted.setDate(shifted.getDate() + weeks * 7);
  return getCommissionWeek(shifted);
};

export const formatWeekLabel = (week) => `${formatShortDate(week.startDate)} – ${formatShortDate(week.endDate)}`;
