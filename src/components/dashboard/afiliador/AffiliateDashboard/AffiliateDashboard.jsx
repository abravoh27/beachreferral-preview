'use client';
import React, { useState } from 'react';
import AffiliateForm from '../AffiliateForm/AffiliateForm';
import AffiliateStats from '../AffiliateStats/AffiliateStats';
import MyConcierges from '../MyConcierges/MyConcierges';
import AffiliateCommissionReport from '@/components/dashboard/shared/AffiliateCommissionReport/AffiliateCommissionReport';
import Modal from '@/components/ui/Modal/Modal';
import Button from '@/components/ui/Button/Button';
import './AffiliateDashboard.css';

const AffiliateDashboard = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="affiliate-dashboard">
      <div className="affiliate-dashboard__topbar">
        <h2>Panel de Afiliación</h2>
        <Button onClick={() => setIsFormOpen(true)}>+ Registrar Concierge</Button>
      </div>

      <AffiliateStats />
      <AffiliateCommissionReport scope="own" />
      <MyConcierges />

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Registrar Concierge">
        <AffiliateForm variant="modal" onAffiliated={() => setIsFormOpen(false)} />
      </Modal>
    </div>
  );
};

export default AffiliateDashboard;
