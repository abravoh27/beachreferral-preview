import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

// Acción interna del dashboard (no del sitio externo): se autentica con el
// ID token de Firebase del admin que hace la llamada, no con x-api-key.
// Borra la cuenta de Firebase Auth (libera el correo para poder reusarse)
// y su documento en Firestore. Solo Admin/Owner pueden llamarlo, y solo
// para cuentas de Cajera/Afiliador (mismo alcance que "Desactivar").
export async function POST(request) {
  const authHeader = request.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ error: 'Falta autenticación.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const { uid } = body || {};
  if (!uid) {
    return NextResponse.json({ error: 'Falta uid.' }, { status: 400 });
  }

  try {
    const adminAuth = getAdminAuth();
    const db = getAdminDb();

    // 1. Verificar que quien llama es un admin/owner activo y autenticado.
    const decoded = await adminAuth.verifyIdToken(idToken);
    const callerDoc = await db.collection('users').doc(decoded.uid).get();
    const caller = callerDoc.data();
    if (!callerDoc.exists || !caller || !['admin', 'owner'].includes(caller.role) || caller.active === false) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
    }

    // 2. Solo se permite eliminar Cajera/Afiliador desde aquí.
    const targetDoc = await db.collection('users').doc(uid).get();
    if (!targetDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }
    const target = targetDoc.data();
    if (!['cajera', 'afiliador'].includes(target.role)) {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar cuentas de Cajera o Afiliador desde aquí.' },
        { status: 400 }
      );
    }

    // 3. Borrar Auth (libera el correo) y el documento de Firestore.
    await adminAuth.deleteUser(uid).catch((err) => {
      if (err.code !== 'auth/user-not-found') throw err;
    });
    await db.collection('users').doc(uid).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json({ error: 'Error interno al eliminar el usuario.' }, { status: 500 });
  }
}
