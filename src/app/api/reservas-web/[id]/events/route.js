import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { checkApiKey } from '@/lib/apiAuth';

export const runtime = 'nodejs';

// Cada evento solo ESTABLECE campos a un valor fijo -- llamarlo 2 veces con
// el mismo evento no causa ningún efecto extra, así que los reintentos del
// sitio web son seguros por diseño (sin necesitar una llave de idempotencia
// aparte, a diferencia de la creación).
const EVENT_HANDLERS = {
  reservation_payment_confirmed: () => ({
    paymentStatus: 'paid',
  }),
  reservation_cancelled: (data) => ({
    status: 'Cancelled',
    paymentStatus: 'cancelled',
    observation: data?.reason ? String(data.reason) : 'Cancelada desde el sitio web.',
  }),
  reservation_expired: () => ({
    status: 'Cancelled',
    paymentStatus: 'expired',
    observation: 'Reserva vencida (sin pago a tiempo).',
  }),
  reservation_checked_in: (data) => ({
    status: 'Completed',
    entryTime: data?.entryTime
      ? String(data.entryTime)
      : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    confirmedBy: 'sitio_web_qr',
  }),
};

// POST /api/reservas-web/{id}/events  { "event": "reservation_payment_confirmed", ... }
export async function POST(request, { params }) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const { event, ...data } = body || {};
  const handler = EVENT_HANDLERS[event];
  if (!handler) {
    return NextResponse.json(
      { error: `Evento inválido. Usa uno de: ${Object.keys(EVENT_HANDLERS).join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const db = getAdminDb();
    const docRef = db.collection('sales').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Reserva no encontrada.' }, { status: 404 });
    }

    const update = handler(data);
    await docRef.update({ ...update, updatedAt: FieldValue.serverTimestamp() });

    return NextResponse.json({ success: true, id, event, ...update });
  } catch (error) {
    console.error('Error procesando evento de reserva:', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
