import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { checkApiKey } from '@/lib/apiAuth';

export const runtime = 'nodejs';

// Consultar el estado de una solicitud por su folio.
export async function GET(request, { params }) {
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const { reference } = await params;

  try {
    const db = getAdminDb();
    const docSnap = await db.collection('affiliateApplications').doc(reference).get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'No encontrado.' }, { status: 404 });
    }
    const data = docSnap.data();
    return NextResponse.json({
      reference: docSnap.id,
      status: data.status,
      businessName: data.businessName,
      name: data.name,
      createdAt: data.createdAt?.toDate?.().toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
    });
  } catch (error) {
    console.error('Error consultando solicitud:', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
