'use client';
import React from 'react';
import AffiliateForm from '../AffiliateForm/AffiliateForm';
import MyConcierges from '../MyConcierges/MyConcierges';
import './AffiliateDashboard.css';

const AffiliateDashboard = () => (
  <div className="affiliate-dashboard">
    <AffiliateForm />
    <MyConcierges />
  </div>
);

export default AffiliateDashboard;
