// Estados del flujo de solicitud de afiliación (hotel/concierge/agencia).
// La transición a "active" SIEMPRE requiere una acción manual de un admin
// autenticado -- nunca ocurre sola, ni siquiera al aceptar condiciones.
export const STATUS_CONFIG = {
  new: { label: 'Nueva', bg: '#fff3cd', text: '#856404' },
  information_sent: { label: 'Info Enviada', bg: '#cce5ff', text: '#004085' },
  accepted: { label: 'Aceptada', bg: '#d1ecf1', text: '#0c5460' },
  active: { label: 'Activa (Hotel Afiliado)', bg: '#d4edda', text: '#155724' },
  paused: { label: 'Pausada', bg: '#e2e3e5', text: '#383d41' },
  rejected: { label: 'Rechazada', bg: '#f8d7da', text: '#721c24' },
};

export const STATUS_ORDER = ['new', 'information_sent', 'accepted', 'active', 'paused', 'rejected'];

// A qué estado(s) se puede pasar desde cada estado actual, y el texto del botón.
export const STATUS_TRANSITIONS = {
  new: [{ to: 'information_sent', label: 'Marcar Info Enviada' }],
  information_sent: [{ to: 'accepted', label: 'Marcar Aceptada' }],
  accepted: [{ to: 'active', label: '✅ Activar como Hotel Afiliado', primary: true }],
  active: [{ to: 'paused', label: 'Pausar' }],
  paused: [{ to: 'active', label: 'Reactivar' }],
  rejected: [],
};

// El rechazo se puede hacer desde casi cualquier estado activo del flujo.
export const REJECTABLE_FROM = ['new', 'information_sent', 'accepted', 'paused'];
