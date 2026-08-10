import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';

// firebase-admin necesita Node.js (no funciona en el runtime "Edge").
export const runtime = 'nodejs';

// Endpoint que el sitio web público (aparte de esta app) llama DESPUÉS de
// confirmar un pago exitoso (ej. vía webhook de Clip). Crea la reserva en
// Firestore con source: "sitio_web" y regresa el link al boleto con QR.
//
// Seguridad: requiere el header "x-api-key" con el valor de la variable de
// entorno WEB_BOOKING_API_KEY. Sin eso, cualquiera en internet podría crear
// reservas falsas marcadas como pagadas.
export async function POST(request) {
  const apiKey = request.headers.get('x-api-key');
  if (!process.env.WEB_BOOKING_API_KEY || apiKey !== process.env.WEB_BOOKING_API_KEY) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const { date, scheduledTime, reservationFor, quantity, amount, paymentReference, customerEmail, customerPhone } = body || {};

  // Validación mínima de campos requeridos
  const missing = [];
  if (!date) missing.push('date');
  if (!reservationFor) missing.push('reservationFor');
  if (!quantity) missing.push('quantity');
  if (amount === undefined || amount === null) missing.push('amount');
  if (!paymentReference) missing.push('paymentReference');
  if (missing.length > 0) {
    return NextResponse.json({ error: `Faltan campos: ${missing.join(', ')}` }, { status: 400 });
  }

  const quantityNum = parseInt(quantity);
  const amountNum = parseFloat(amount);
  if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
    return NextResponse.json({ error: 'quantity inválido.' }, { status: 400 });
  }
  if (!Number.isFinite(amountNum) || amountNum < 0) {
    return NextResponse.json({ error: 'amount inválido.' }, { status: 400 });
  }

  try {
    const db = getAdminDb();

    const docRef = await db.collection('sales').add({
      source: 'sitio_web',
      date: String(date),
      scheduledTime: scheduledTime ? String(scheduledTime) : '',
      reservationFor: String(reservationFor),
      city: 'Beach Club',
      quantity: quantityNum,
      amount: amountNum,
      totalAmount: amountNum,
      paymentType: 'Pagado en línea (Clip)',
      paymentMethod: 'Clip',
      paymentReference: String(paymentReference),
      customerEmail: customerEmail ? String(customerEmail) : '',
      customerPhone: customerPhone ? String(customerPhone) : '',
      status: 'Pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    const origin = new URL(request.url).origin;
    const boletoUrl = `${origin}/boleto/${docRef.id}`;

    return NextResponse.json({ success: true, id: docRef.id, boletoUrl }, { status: 201 });
  } catch (error) {
    console.error('Error creando reserva de sitio web:', error);
    return NextResponse.json({ error: 'Error interno al crear la reserva.' }, { status: 500 });
  }
}
