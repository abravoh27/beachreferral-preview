'use client';
import React from 'react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import ArrivalsBoard from '@/components/dashboard/cajera/ArrivalsBoard/ArrivalsBoard';
import OnlineReservations from '@/components/dashboard/cajera/OnlineReservations/OnlineReservations';

export default function Page() {
  const { allowed, loading } = useRoleGuard('cajera');

  if (loading || !allowed) return null;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Recepción - Beach Club</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <OnlineReservations />
        <ArrivalsBoard />
      </div>
    </div>
  );
}
