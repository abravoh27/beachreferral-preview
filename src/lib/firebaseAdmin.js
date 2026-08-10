import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK: SOLO se usa del lado del servidor (rutas /api), nunca
// se importa desde un componente de cliente. Se autentica con una cuenta de
// servicio (Service Account) en vez de con las reglas normales de Firestore,
// por eso puede escribir aunque no haya un usuario logueado -- es lo que
// permite que el futuro sitio web (sin login) cree reservas de forma segura.
//
// Requiere estas 3 variables de entorno (ver README para cómo generarlas):
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // En variables de entorno los saltos de línea de la private key llegan
  // como "\n" literal (texto), hay que convertirlos a saltos de línea reales.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Faltan las variables de entorno de Firebase Admin (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).'
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
