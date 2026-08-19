import { NextResponse } from 'next/server';

// Manda un WhatsApp gratis (vía CallMeBot) a cada destinatario configurado
// cuando un concierge registra una reserva nueva. Se llama desde el
// cliente justo después de guardar la venta en Firestore (fire-and-forget:
// si esto falla, la venta ya se guardó bien de todos modos).
//
// Configuración: variable de entorno WHATSAPP_NOTIFY_RECIPIENTS con un
// JSON array así:
//   [{"name":"Armando","phone":"5219841234567","apikey":"123456"},
//    {"name":"Cajera","phone":"5219987654321","apikey":"654321"}]
// (phone en formato internacional, sin "+" ni espacios; apikey lo da
// CallMeBot al activar el número por WhatsApp)
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const { reservationFor, city, date, quantity, concierge } = body || {};

  let recipients = [];
  try {
    recipients = JSON.parse(process.env.WHATSAPP_NOTIFY_RECIPIENTS || '[]');
  } catch (err) {
    console.error('WHATSAPP_NOTIFY_RECIPIENTS mal formado:', err);
  }

  if (recipients.length === 0) {
    // No hay nadie configurado todavía -- no es un error, solo no se manda nada.
    return NextResponse.json({ success: true, sent: 0 });
  }

  const message =
    `🏖️ Nueva reserva\n` +
    `👤 ${reservationFor || 'Sin nombre'}\n` +
    `📍 ${city || '-'} · 👥 ${quantity || '-'} pax\n` +
    `📅 ${date || '-'}\n` +
    `🙋 Concierge: ${concierge || '-'}`;

  const results = await Promise.allSettled(
    recipients.map(({ phone, apikey }) => {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apikey)}`;
      return fetch(url);
    })
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return NextResponse.json({ success: true, sent, total: recipients.length });
}
