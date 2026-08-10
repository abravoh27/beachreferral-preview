'use client';
import React from 'react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import ArrivalsBoard from '@/components/dashboard/cajera/ArrivalsBoard/ArrivalsBoard';

export default function Page() {
  const { allowed, loading } = useRoleGuard('cajera');

  if (loading || !allowed) return null;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Recepción - Beach Club</h2>
      <ArrivalsBoard />
    </div>
  );
}
