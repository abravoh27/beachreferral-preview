import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { checkApiKey } from '@/lib/apiAuth';

export const runtime = 'nodejs';

// El sitio web llama aquí (servidor a servidor) cuando alguien llega con
// ?ref=CODIGO, para saber a qué concierge/hotel atribuir la reserva antes
// de mostrar el checkout. NO es para llamarse desde el navegador del cliente.
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

  const { code } = body || {};
  if (!code) {
    return NextResponse.json({ valid: false, error: 'Falta el código.' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('users')
      .where('referralCode', '==', String(code).toUpperCase())
      .where('role', '==', 'vendedor')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    const conciergeDoc = snapshot.docs[0];
    const concierge = conciergeDoc.data();

    // Solo se considera válido si además la cuenta está activa.
    if (concierge.active === false) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    return NextResponse.json({
      valid: true,
      affiliateId: conciergeDoc.id,
      affiliateName: concierge.name || concierge.email,
      hotelId: concierge.hotel || null,
      hotelName: concierge.hotel || null,
    });
  } catch (error) {
    console.error('Error validando código de referido:', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
