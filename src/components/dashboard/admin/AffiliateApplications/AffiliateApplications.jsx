'use client';
import React, { useMemo, useState } from 'react';
import { useAffiliateApplications } from '@/hooks/useAffiliateApplications';
import Card from '@/components/ui/Card/Card';
import Button from '@/components/ui/Button/Button';
import { STATUS_CONFIG, STATUS_ORDER } from '@/lib/affiliateApplicationStatus';
import AffiliateApplicationDetail from './AffiliateApplicationDetail';
import NewApplicationModal from './NewApplicationModal';
import './AffiliateApplications.css';

const AffiliateApplications = () => {
  const { applications, loading } = useAffiliateApplications();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewOpen, setIsNewOpen] = useState(false);

  const counts = useMemo(() => {
    const c = { all: applications.length };
    STATUS_ORDER.forEach((s) => {
      c[s] = applications.filter((a) => a.status === s).length;
    });
    return c;
  }, [applications]);

  const visible = statusFilter === 'all' ? applications : applications.filter((a) => a.status === statusFilter);

  const openDetail = (app) => {
    setSelected(app);
    setIsDetailOpen(true);
  };

  return (
    <>
      <Card title="Solicitudes de Afiliación">
        <div className="apps-topbar">
          <div className="apps-filters">
            <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>
              Todas ({counts.all})
            </button>
            {STATUS_ORDER.map((s) => (
              <button key={s} className={statusFilter === s ? 'active' : ''} onClick={() => setStatusFilter(s)}>
                {STATUS_CONFIG[s].label} ({counts[s] || 0})
              </button>
            ))}
          </div>
          <Button onClick={() => setIsNewOpen(true)}>+ Nueva Solicitud</Button>
        </div>

        {loading ? (
          <p className="apps-empty">Cargando...</p>
        ) : visible.length === 0 ? (
          <p className="apps-empty">No hay solicitudes en este estado.</p>
        ) : (
          <div className="apps-grid">
            {visible.map((app) => {
              const statusInfo = STATUS_CONFIG[app.status] || { label: app.status, bg: '#eee', text: '#333' };
              return (
                <button key={app.id} className="app-card" onClick={() => openDetail(app)}>
                  <div className="app-card__top">
                    <span className="app-card__name">{app.businessName}</span>
                    <span className="app-card__badge" style={{ background: statusInfo.bg, color: statusInfo.text }}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="app-card__contact">{app.name} · {app.phone || app.email}</div>
                  <div className="app-card__ref">{app.reference}</div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <AffiliateApplicationDetail application={selected} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} />
      <NewApplicationModal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} />
    </>
  );
};

export default AffiliateApplications;
