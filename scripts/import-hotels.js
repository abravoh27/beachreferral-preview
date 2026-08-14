// Script de un solo uso: importa la lista histórica de "Lugar donde trabaja"
// del Airtable viejo como solicitudes de afiliación PENDIENTES (status: "new"),
// porque se dejó de dar seguimiento y el RRPP nuevo las va a visitar/confirmar.
//
// Uso: node scripts/import-hotels.js
// Requiere la variable de entorno GOOGLE_APPLICATION_CREDENTIALS apuntando
// al archivo .json de la cuenta de servicio.

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!SERVICE_ACCOUNT_PATH) {
  console.error('Falta GOOGLE_APPLICATION_CREDENTIALS');
  process.exit(1);
}

initializeApp({ credential: cert(require(SERVICE_ACCOUNT_PATH)) });
const db = getFirestore();

const HOTELS = [
  "A perfect place", "Acanto hotel", "Aldea Thai", "Aloft Playa del Carmen", "Alpha towers",
  "Anah playa", "Aquatico", "Banana boutique hotel", "Banana boutique y caribbean", "Be playa",
  "Beach house hotel", "Bosque caribe", "Boutique illusion", "ByB Condos", "Caché hotel",
  "Calle 38th", "Caribbean", "Caribbean paradise", "Casa colibrí Hotel", "Casa corazón",
  "Ceren condos", "Coco Río hotel", "Ipana", "Daños Tours", "DK 52",
  "Duna condominio", "El campanario hotel", "El taj condos", "Emiliano 42 condos boutique", "Grand Fifty Suites",
  "Heliko CONDOS", "Hotel 52", "Hotel acanto", "Hotel antena", "Hotel Aria",
  "Hotel Caribbean Paradise", "Hotel cielo", "Hotel Jabines", "Hotel mariachi by kavia", "Hotel playa encantada",
  "Hotel plaza centro", "Hotel Riviera Caribe Maya", "Hotel Riviera del sol", "Hotel san Pedro", "Hotel Siaan",
  "Hotel soho", "Hotel Yum K'iin", "Hotelito del Mar", "Icono playa", "Illusion express",
  "It hotel", "It residences", "Jatsaha", "Kuxtal", "La quinta residencias by Anah",
  "Liltown by Menesse", "Live Coco", "Los Ángeles barber shop", "Lucianos barber", "Lunada condominio",
  "Macondo 5ta avenida", "Macondo hotel", "mare condominios", "Marea 34", "Marila condos",
  "Marvic Hotel Boutique", "Maya turquesa hotel", "Mayaluxe villas privadas", "Mayan art", "Meliora by Bunik",
  "Menesse coco Beach", "Menesse on the Beach", "Menesse sea Tower", "Miranda condominio", "Moonshine",
  "My Menesse in playa", "Nautilus hotel", "Nohoch adventures", "Nohoch tours", "Nomad Deluxe",
  "Oceana", "One Paralia Menesse", "Oxygen", "Oxygen condo", "Particular",
  "Piedrazul condoestudio", "Porto playa", "Quinta Nina hotel", "Residencia condos", "Sabbia Condos",
  "Sensai Downtown", "Senses artisan 5ta avenida", "Serenada condos", "Serenity hotel boutique", "Singular dream",
  "Solea", "Studio 34 condo", "Suut hostal boutique", "Tabgear", "Terrase Aria Balkon",
  "Terrasse/balkon/verandah", "Terrazas luxury condos", "The Boat residences", "The City Menesse", "The Gallery Condos",
  "The palm hotel", "The Shore at 46th", "Torre diez", "TORRES 48", "Tours 48 con 5ta",
  "Valle aurora", "Vía 38 condominio", "Villa Segovia condo", "Volta",
];

const generateReference = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `AFF-${y}${m}${d}-${random}`;
};

async function run() {
  console.log(`Importando ${HOTELS.length} lugares como solicitudes "new"...`);
  let created = 0;

  for (const businessName of HOTELS) {
    const reference = generateReference();
    await db.collection('affiliateApplications').doc(reference).set({
      reference,
      name: 'Por confirmar',
      businessName,
      roleType: '',
      phone: '',
      email: '',
      interests: '',
      monthlyGuests: '',
      notes: 'Importado de lista histórica (Airtable). Se dejó de dar seguimiento; pendiente de que el nuevo RRPP lo visite y confirme.',
      contactConsent: false,
      promotionsConsent: false,
      source: 'lista_historica_airtable',
      status: 'new',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await db.collection('affiliateApplications').doc(reference).collection('history').add({
      status: 'new',
      note: 'Importado en bloque desde la lista histórica de Airtable.',
      changedAt: FieldValue.serverTimestamp(),
      changedByEmail: 'import_script',
    });
    created += 1;
    console.log(`  ${created}/${HOTELS.length} — ${businessName} (${reference})`);
  }

  console.log(`Listo. ${created} solicitudes creadas con status "new".`);
}

run().catch((err) => {
  console.error('Error en la importación:', err);
  process.exit(1);
});
