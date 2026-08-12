// La "semana de comisión" corre de Lunes a Domingo. El domingo cierra la
// semana y el pago se hace el Miércoles siguiente (Lunes/Martes para juntar
// y revisar el dinero, y pagar el Miércoles).
// Ej: semana Lun 10 - Dom 16 -> se paga el Miércoles 19.

const toDateOnly = (d) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const formatDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const formatShortDate = (d) => `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;

// Dado cualquier día de referencia, regresa el rango Lunes-Domingo que lo
// contiene, más la fecha de pago (el miércoles siguiente al domingo).
export const getCommissionWeek = (referenceDate = new Date()) => {
  const ref = toDateOnly(referenceDate);
  const dow = ref.getDay(); // 0=Domingo ... 6=Sábado
  const daysSinceMonday = (dow + 6) % 7; // Lunes->0, Martes->1 ... Domingo->6

  const start = new Date(ref);
  start.setDate(ref.getDate() - daysSinceMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Domingo

  const payDate = new Date(end);
  payDate.setDate(end.getDate() + 3); // domingo + 3 días = miércoles

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
