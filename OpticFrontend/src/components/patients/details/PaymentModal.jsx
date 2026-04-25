import React, { useState } from 'react';
import { apiClient } from '../../../services/apiClient';

const PaymentModal = ({ sale, payment, onClose, onSuccess }) => {
    // If a 'payment' object is passed WITH an id, we are Editing. Otherwise, Adding.
    const isEdit = !!payment?.id;

    const [form, setForm] = useState({
        monto: payment?.monto || 0,
        fechaPago: payment?.fechaPago ? payment.fechaPago.split('T')[0] : (sale?.fecha ? sale.fecha.split('T')[0] : new Date().toISOString().split('T')[0]),
        metodoPago: payment?.metodoPago || 'Efectivo'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        const monto = parseFloat(form.monto);
        if (!monto || monto <= 0) {
            setError("El monto debe ser mayor a cero.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                monto: monto,
                fechaPago: new Date(form.fechaPago + 'T00:00:00Z').toISOString(),
                metodoPago: form.metodoPago
            };

            let response;
            if (isEdit) {
                // PUT api/sales/{saleId}/payments/{paymentId}
                response = await apiClient.put(`/api/sales/${sale.id}/payments/${payment.id}`, payload);
            } else {
                // POST api/sales/{saleId}/payments
                response = await apiClient.post(`/api/sales/${sale.id}/payments`, payload);
            }

            if (response && response.id) {
                onSuccess(response); // Devuelve la venta actualizada con el nuevo saldo
            } else {
                throw new Error('Respuesta inválida del servidor.');
            }
        } catch (err) {
            console.error('Error guardando abono:', err);
            setError(err.message || 'Error al guardar el abono.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
            <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', maxWidth: '400px', width: '95%' }} className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>
                        {isEdit ? 'Editar Abono' : 'Agregar Nuevo Abono'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                </div>

                {error && (
                    <div className="alert alert-danger mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="form-group">
                        <label className="text-sm font-semibold text-slate-700 block mb-1">Monto ($)</label>
                        <input
                            type="number"
                            name="monto"
                            className="form-input w-full font-bold text-emerald-600"
                            value={form.monto}
                            onChange={handleChange}
                            min="0" step="0.01"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="form-group">
                        <label className="text-sm font-semibold text-slate-700 block mb-1">Fecha de Pago</label>
                        <input
                            type="date"
                            name="fechaPago"
                            className="form-input w-full"
                            value={form.fechaPago}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="text-sm font-semibold text-slate-700 block mb-1">Método de Pago</label>
                        <select
                            name="metodoPago"
                            className="form-input w-full"
                            value={form.metodoPago}
                            onChange={handleChange}
                        >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta">Tarjeta</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Garantía / Cortesía">Garantía / Cortesía</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
                    <button className="btn-primary" onClick={handleSave} disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar Abono'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
