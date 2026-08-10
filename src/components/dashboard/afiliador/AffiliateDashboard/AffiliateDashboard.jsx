'use client';
import React from 'react';
import AffiliateForm from '../AffiliateForm/AffiliateForm';
import MyConcierges from '../MyConcierges/MyConcierges';
import AffiliateCommissionReport from '@/components/dashboard/shared/AffiliateCommissionReport/AffiliateCommissionReport';
import './AffiliateDashboard.css';

const AffiliateDashboard = () => (
  <div className="affiliate-dashboard">
    <AffiliateForm />
    <AffiliateCommissionReport scope="own" />
    <div className="affiliate-dashboard__history">
      <MyConcierges />
    </div>
  </div>
);

export default AffiliateDashboard;
