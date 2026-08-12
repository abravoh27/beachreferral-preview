'use client';
import React, { useState } from 'react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import ArrivalsBoard from '@/components/dashboard/cajera/ArrivalsBoard/ArrivalsBoard';
import OnlineReservations from '@/components/dashboard/cajera/OnlineReservations/OnlineReservations';
import AffiliatedHotels from '@/components/dashboard/cajera/AffiliatedHotels/AffiliatedHotels';

const tabBtnStyle = (active) => ({
  padding: '8px 16px',
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem',
  background: active ? '#007bff' : '#f1f3f5',
  color: active ? 'white' : '#212529',
});

export default function Page() {
  const { allowed, loading } = useRoleGuard('cajera');
  const [tab, setTab] = useState('llegadas'); // 'llegadas' | 'hoteles'

  if (loading || !allowed) return null;

  return (
    <div>
      <h2 style={{ marginBottom: '12px' }}>Recepción - Beach Club</h2>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button style={tabBtnStyle(tab === 'llegadas')} onClick={() => setTab('llegadas')}>Llegadas</button>
        <button style={tabBtnStyle(tab === 'hoteles')} onClick={() => setTab('hoteles')}>Hoteles Afiliados</button>
      </div>

      {tab === 'llegadas' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <OnlineReservations />
          <ArrivalsBoard />
        </div>
      ) : (
        <AffiliatedHotels />
      )}
    </div>
  );
}
