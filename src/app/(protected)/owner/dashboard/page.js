import React from 'react';
import MetricsSummary from '@/components/dashboard/owner/MetricsSummary/MetricsSummary';
import TopSellersList from '@/components/dashboard/owner/TopSellersList/TopSellersList';
import ExcelExportButton from '@/components/dashboard/admin/ExcelExportButton/ExcelExportButton';
import AffiliateCommissionReport from '@/components/dashboard/shared/AffiliateCommissionReport/AffiliateCommissionReport';

export default function Page() {
  return (
    <div>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px"}}>
        <h2>Owner Dashboard</h2>
        <ExcelExportButton />
      </div>

      <MetricsSummary />
      <TopSellersList />
      <div style={{marginTop: "2rem"}}>
        <AffiliateCommissionReport scope="all" />
      </div>
    </div>
  );
}