import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { checkApiKey } from '@/lib/apiAuth';
import { generateAffiliateReference } from '@/lib/referenceGenerator';

// El sitio público llama aquí cuando un hotel/concierge/agencia llena la
// solicitud de afiliación. Queda en estado "new" -- NUNCA se activa solo.
// Solo un admin autenticado, desde el dashboard, puede pasarla a "active".
export const runtime = 'nodejs';

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
    name,
    businessName,
    roleType,
    phone,
    email,
    interests,
    monthlyGuests,
    notes,
    contactConsent,
    promotionsConsent,
    source,
  } = body || {};

  const missing = [];
  if (!name) missing.push('name');
  if (!businessName) missing.push('businessName');
  if (!phone && !email) missing.push('phone o email');
  if (missing.length > 0) {
    return NextResponse.json({ error: `Faltan campos: ${missing.join(', ')}` }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    // Idempotencia: si el sitio manda su propio "reference" y reintenta la
    // misma solicitud, regresamos la existente en vez de duplicarla.
    const ref = reference ? String(reference) : generateAffiliateReference();
    const docRef = db.collection('affiliateApplications').doc(ref);

    const existing = await docRef.get();
    if (existing.exists) {
      const data = existing.data();
      return NextResponse.json(
        { success: true, reference: ref, status: data.status, alreadyExisted: true },
        { status: 200 }
      );
    }

    await docRef.set({
      reference: ref,
      name: String(name),
      businessName: String(businessName),
      roleType: roleType ? String(roleType) : '',
      phone: phone ? String(phone) : '',
      email: email ? String(email) : '',
      interests: interests ? String(interests) : '',
      monthlyGuests: monthlyGuests ? String(monthlyGuests) : '',
      notes: notes ? String(notes) : '',
      contactConsent: !!contactConsent,
      promotionsConsent: !!promotionsConsent,
      source: source ? String(source) : 'website_about',
      status: 'new',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await docRef.collection('history').add({
      status: 'new',
      note: 'Solicitud recibida desde el sitio web.',
      changedAt: FieldValue.serverTimestamp(),
      changedByEmail: 'sitio_web',
    });

    return NextResponse.json({ success: true, reference: ref, status: 'new' }, { status: 201 });
  } catch (error) {
    console.error('Error creando solicitud de afiliado:', error);
    return NextResponse.json({ error: 'Error interno al crear la solicitud.' }, { status: 500 });
  }
}
