import React from 'react';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { getAdminDb } from '@/lib/firebaseAdmin';
import './boleto.css';

// Página PÚBLICA (sin login) del boleto: el sitio web externo manda aquí
// al cliente después de que Clip confirma el pago. Se renderiza en el
// servidor con el Admin SDK, así que no depende de que el cliente esté
// autenticado ni de las reglas de Firestore.
export default async function BoletoPage({ params }) {
  const { id } = await params;

  let sale = null;
  let error = null;

  try {
    const db = getAdminDb();
    const docSnap = await db.collection('sales').doc(id).get();
    if (docSnap.exists) {
      sale = { id: docSnap.id, ...docSnap.data() };
    }
  } catch (err) {
    console.error('Error cargando boleto:', err);
    error = 'No se pudo cargar el boleto.';
  }

  if (error || !sale) {
    return (
      <main className="boleto-page">
        <div className="boleto-card boleto-card--error">
          <h1>Boleto no encontrado</h1>
          <p>Revisa el link o contacta al Beach Club.</p>
        </div>
      </main>
    );
  }

  const h = await headers();
  const host = h.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const boletoUrl = `${protocol}://${host}/boleto/${sale.id}`;

  const qrDataUrl = await QRCode.toDataURL(boletoUrl, { width: 320, margin: 2 });

  const isUsed = sale.status === 'Completed';
  const isCancelled = sale.status === 'Cancelled';

  return (
    <main className="boleto-page">
      <div className="boleto-card">
        <div className="boleto-card__header">
          <img src="https://i.imgur.com/NqvR5G3.png" alt="Beach Club" className="boleto-logo" />
          <h1>Boleto Day Pass</h1>
        </div>

        {isCancelled ? (
          <div className="boleto-status boleto-status--cancelled">❌ Esta reserva fue cancelada</div>
        ) : isUsed ? (
          <div className="boleto-status boleto-status--used">✅ Acceso ya confirmado</div>
        ) : (
          <div className="boleto-status boleto-status--valid">🎟️ Válido — muestra este código en caja</div>
        )}

        <div className="boleto-info">
          <div className="boleto-info__row">
            <span>Fecha</span>
            <strong>{sale.date}</strong>
          </div>
          {sale.scheduledTime && (
            <div className="boleto-info__row">
              <span>Hora de llegada (referencia)</span>
              <strong>{sale.scheduledTime}</strong>
            </div>
          )}
          <div className="boleto-info__row">
            <span>Reserva a nombre de</span>
            <strong>{sale.reservationFor || '-'}</strong>
          </div>
          <div className="boleto-info__row">
            <span>Personas</span>
            <strong>{sale.quantity}</strong>
          </div>
          <div className="boleto-info__row">
            <span>Total pagado</span>
            <strong>${parseFloat(sale.totalAmount || sale.amount || 0).toLocaleString()}</strong>
          </div>
        </div>

        {!isCancelled && (
          <div className="boleto-qr">
            <img src={qrDataUrl} alt="Código QR del boleto" />
            <p>Este código es tu acceso — no lo compartas.</p>
          </div>
        )}

        <p className="boleto-footnote">El consumo de alimentos y bebidas se paga aparte en el Beach Club.</p>
      </div>
    </main>
  );
}
