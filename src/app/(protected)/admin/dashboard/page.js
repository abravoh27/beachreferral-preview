'use client';
import React, { useState } from 'react'
import AllSalesTable from '@/components/dashboard/admin/AllSalesTable/AllSalesTable'
import ExcelExportButton from '@/components/dashboard/admin/ExcelExportButton/ExcelExportButton'
import UserManagement from '@/components/dashboard/admin/UserManagement/UserManagement'
import AffiliateCommissionReport from '@/components/dashboard/shared/AffiliateCommissionReport/AffiliateCommissionReport'

export default function Page () {
  const [tab, setTab] = useState('ventas'); // 'ventas' | 'usuarios' | 'comisiones'

  return (
    <div>
      <h2 style={{marginBottom:"12px"}}>Admin Dashboard</h2>
      <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px",flexWrap:"wrap"}}>
        <div className="date-buttons">
          <button className={tab === 'ventas' ? 'active' : ''} onClick={() => setTab('ventas')}>Ventas</button>
          <button className={tab === 'usuarios' ? 'active' : ''} onClick={() => setTab('usuarios')}>Usuarios</button>
          <button className={tab === 'comisiones' ? 'active' : ''} onClick={() => setTab('comisiones')}>Comisiones</button>
        </div>
        {tab === 'ventas' && <ExcelExportButton />}
      </div>

      {tab === 'ventas' && <AllSalesTable />}
      {tab === 'usuarios' && <UserManagement />}
      {tab === 'comisiones' && <AffiliateCommissionReport scope="all" />}
    </div>
  )
}
