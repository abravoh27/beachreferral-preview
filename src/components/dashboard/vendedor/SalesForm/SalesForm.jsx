/* File: src/components/dashboard/vendedor/SalesForm/SalesForm.jsx
   Type: uploaded file modification
*/
'use client';
import React, { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import Input from '@/components/ui/Input/Input';
import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import'./SalesForm.css';

const SalesForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Estados auxiliares para la lógica de UI
  const [isAnticipo, setIsAnticipo] = useState(true); // Checkbox estado

  const initialState = {
    date: '',
    city: '',
    quantity: 1,
    referredBy: '', // Siempre es el propio concierge (ver useEffect abajo)
    reservationFor: '', // Nuevo campo
    amount: '', // Balance
    paymentMethod: 'Efectivo'
  };

  const [formData, setFormData] = useState(initialState);

  // El concierge SOLO puede registrar su propia venta: el campo "Concierge"
  // siempre es él mismo, de solo lectura (no se puede escribir a nombre de otro).
  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, referredBy: user.email }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculamos valores finales
      const finalPaymentType = isAnticipo ? 'Pago Anticipo' : 'No Pago Anticipo';
      
      await addDoc(collection(db, "sales"), {
        ...formData,
        paymentType: finalPaymentType,
        amount: parseFloat(formData.amount), // Balance pendiente
        quantity: parseInt(formData.quantity),
        sellerEmail: user.email,
        sellerId: user.uid,
        status: 'Pending',
        createdAt: new Date()
      });

      Swal.fire({
        title: '¡Venta Registrada!',
        text: 'La venta se ha guardado exitosamente.',
        icon: 'success',
        confirmButtonColor: '#007bff',
      });

      // Resetear formulario (el Concierge se vuelve a llenar solo, vía el useEffect)
      setFormData({ ...initialState, referredBy: user.email });
      setIsAnticipo(true);
    } catch (error) {
      console.error("Error al guardar:", error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al guardar la venta.',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // Cálculo visual del anticipo (100 * pax)
  const anticipoValue = (parseInt(formData.quantity) || 0) * 100;

  return (
    <Card title="Registrar Nueva Venta">
      <form onSubmit={handleSubmit} className="sales-form">
        
        {/* Fila 1: Fecha y Ciudad */}
        <div className="form-row">
          <Input 
            label="Fecha" 
            id="date" 
            type="date" 
            value={formData.date} 
            onChange={handleChange} 
            required 
          />
          <Input 
            label="Ciudad" 
            id="city" 
            type="text" 
            value={formData.city} 
            onChange={handleChange} 
            required 
          />
        </div>

        {/* Fila 2: Cantidad y Forma de Pago */}
        <div className="form-row">
          <Input 
            label="Cant. Personas" 
            id="quantity" 
            type="number" 
            value={formData.quantity} 
            onChange={handleChange} 
            required 
          />
           <div className="input-group">
            <label htmlFor="paymentMethod">Forma de Pago</label>
            <select 
              id="paymentMethod" 
              value={formData.paymentMethod} 
              onChange={handleChange}
              required
            >
              <option value="Efectivo">Efectivo</option>
              <option value="TC">Tarjeta de Crédito (TC)</option>
            </select>
          </div>
        </div>

        {/* Fila 3: Concierge (solo lectura, siempre el propio usuario) y Reserva Para */}
        <div className="form-row">
          <div className="input-group">
            <label>Concierge</label>
            <input type="text" value={user?.email || ''} disabled />
          </div>

          <Input
            label="Reserva para" 
            id="reservationFor" 
            type="text" 
            placeholder="Nombre del titular"
            value={formData.reservationFor} 
            onChange={handleChange} 
            required 
          />
        </div>

        {/* Fila 4: Checkbox Anticipo y Balance */}
        <div className="form-row">
           {/* Checkbox Tipo de Cobro */}
           <div className="input-group checkbox-container">
            <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <input 
                type="checkbox" 
                checked={isAnticipo} 
                onChange={(e) => setIsAnticipo(e.target.checked)}
                style={{width: '20px', height: '20px'}} 
              />
              <span style={{fontWeight: 'bold'}}>
                {isAnticipo ? `Pago Anticipo ($${anticipoValue})` : 'No Pago Anticipo'}
              </span>
            </label>
          </div>

          <Input 
            label="Balance (Lo que falta pagar)" 
            id="amount" 
            type="number" 
            value={formData.amount} 
            onChange={handleChange} 
            required 
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Registrar Venta'}
        </Button>
      </form>
    </Card>
  );
};

export default SalesForm;