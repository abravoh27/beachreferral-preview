import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { checkApiKey } from '@/lib/apiAuth';
import { generateAffiliateReference } from '@/lib/referenceGenerator';

// firebase-admin necesita Node.js (no funciona en el runtime "Edge").
export const runtime = 'nodejs';

// Evento reservation_created: el sitio web llama aquí cuando el formulario
// ya fue validado y guardado de su lado (NO en el simple clic de "Reservar").
// El pago se confirma después con un evento aparte (ver /events).
//
// Idempotencia: si el sitio manda su propio "reference" (folio de Nasim
// Group) y reintenta la misma llamada, se regresa la reserva ya creada en
// vez de duplicarla -- se usa ese folio como ID del documento en Firestore.
export async function POST(request) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const {
    reference,
    business,
    experienceType,
    date,
    scheduledTime,
    duration,
    quantity,
    reservationFor,
    customerEmail,
    customerPhone,
    specialOccasion,
    decorationRequest,
    notes,
    amount,
    currency,
    paymentReference,
    referralCode,
    affiliateId: affiliateIdInput,
    hotelId: hotelIdInput,
  } = body || {};

  const missing = [];
  if (!date) missing.push('date');
  if (!reservationFor) missing.push('reservationFor');
  if (!quantity) missing.push('quantity');
  if (amount === undefined || amount === null) missing.push('amount');
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
    const id = reference ? String(reference) : generateAffiliateReference().replace('AFF-', 'RES-');
    const docRef = db.collection('sales').doc(id);

    const existing = await docRef.get();
    if (existing.exists) {
      const origin = new URL(request.url).origin;
      return NextResponse.json(
        { success: true, id, boletoUrl: `${origin}/boleto/${id}`, alreadyExisted: true },
        { status: 200 }
      );
    }

    // Si viene un código de referido, se resuelve a un concierge real para
    // que la comisión del afiliador se calcule automáticamente (igual que
    // las ventas registradas a mano desde el dashboard).
    let sellerId = null;
    let sellerEmail = '';
    let referredBy = '';
    let affiliateId = affiliateIdInput || null;
    let hotelId = hotelIdInput || null;

    if (referralCode) {
      const snapshot = await db
        .collection('users')
        .where('referralCode', '==', String(referralCode).toUpperCase())
        .where('role', '==', 'vendedor')
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const conciergeDoc = snapshot.docs[0];
        const concierge = conciergeDoc.data();
        sellerId = conciergeDoc.id;
        sellerEmail = concierge.email || '';
        referredBy = concierge.email || concierge.name || '';
        affiliateId = affiliateId || conciergeDoc.id;
        hotelId = hotelId || concierge.hotel || null;
      }
    }

    await docRef.set({
      // "source" siempre es "sitio_web" (así lo ve la cajera en un solo
      // apartado); "referralSource" distingue si venía con o sin referido.
      source: 'sitio_web',
      referralSource: sellerId ? 'referred' : 'direct',
      business: business ? String(business) : 'Mandarino Beach Club',
      experienceType: experienceType ? String(experienceType) : 'Day Pass',
      date: String(date),
      scheduledTime: scheduledTime ? String(scheduledTime) : '',
      duration: duration ? String(duration) : '',
      reservationFor: String(reservationFor),
      city: 'Beach Club',
      quantity: quantityNum,
      customerEmail: customerEmail ? String(customerEmail) : '',
      customerPhone: customerPhone ? String(customerPhone) : '',
      specialOccasion: specialOccasion ? String(specialOccasion) : '',
      decorationRequest: decorationRequest ? String(decorationRequest) : '',
      notes: notes ? String(notes) : '',
      amount: amountNum,
      totalAmount: amountNum,
      currency: currency ? String(currency) : 'MXN',
      paymentType: 'Pagado en línea (Clip)',
      paymentMethod: 'Clip',
      paymentReference: paymentReference ? String(paymentReference) : '',
      paymentStatus: 'pending', // se actualiza con el evento reservation_payment_confirmed
      referralCode: referralCode ? String(referralCode).toUpperCase() : '',
      affiliateId,
      hotelId,
      sellerId,
      sellerEmail,
      referredBy,
      status: 'Pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const origin = new URL(request.url).origin;
    const boletoUrl = `${origin}/boleto/${id}`;

    return NextResponse.json({ success: true, id, boletoUrl }, { status: 201 });
  } catch (error) {
    console.error('Error creando reserva de sitio web:', error);
    return NextResponse.json({ error: 'Error interno al crear la reserva.' }, { status: 500 });
  }
}
