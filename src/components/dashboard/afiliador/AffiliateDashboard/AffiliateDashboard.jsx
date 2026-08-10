'use client';
import React from 'react';
import AffiliateForm from '../AffiliateForm/AffiliateForm';
import MyConcierges from '../MyConcierges/MyConcierges';
import './AffiliateDashboard.css';

const AffiliateDashboard = () => (
  <div className="affiliate-dashboard">
    <AffiliateForm />
    <div className="affiliate-dashboard__history">
      <MyConcierges />
    </div>
  </div>
);

export default AffiliateDashboard;
