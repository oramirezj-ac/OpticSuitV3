import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatUtils';
import { formatDateLong } from '../../utils/dateUtils';
import './SalesIndex.css';

const PaymentManagement = ({ onNavigate, params }) => {
    const { saleId } = params || {};
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPayModal, setShowPayModal] = useState(false);
    const [newPayment, setNewPayment] = useState({ monto: '', metodoPago: 'Efectivo', fechaPago: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        if (saleId) fetchSaleDetails();
    }, [saleId]);

    const fetchSaleDetails = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get(`/api/sales/${saleId}`);
            setSale(data);
        } catch (err) {
            console.error("Error fetching sale details:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        try {
            const paymentPayload = {
                ...newPayment,
                fechaPago: newPayment.fechaPago ? new Date(newPayment.fechaPago + 'T00:00:00Z').toISOString() : new Date().toISOString()
            };
            await apiClient.post(`/api/sales/${saleId}/payments`, paymentPayload);
            setShowPayModal(false);
            setNewPayment({ monto: '', metodoPago: 'Efectivo', fechaPago: new Date().toISOString().split('T')[0] });
            fetchSaleDetails(); // Refresh to update balance and list
        } catch (err) {
            console.error("Error al agregar pago:", err);
            setError("No se pudo registrar el pago. " + err.message);
        }
    };

    const handleDeletePayment = (paymentId) => {
        // Redirect to a dedicated delete confirmation page instead of using window.confirm
        onNavigate('payment-delete', { paymentId, saleId });
    };

    if (loading) return <div className="loading-container"><div className="loader"></div></div>;
    if (error) return <div className="alert alert-danger">{error} <button onClick={() => onNavigate('sales')}>Volver</button></div>;
    if (!sale) return <div className="alert alert-warning">No se encontró la venta.</div>;

    const isTotalPaid = sale.saldoPendiente <= 0;

    return (
        <div className="sales-container animate-fade-in">
            <div className="sales-header">
                <h2><span className="icon">💳</span> Gestión de Abonos</h2>
                <button className="btn-secondary" onClick={() => onNavigate('sales')}>Volver al Listado</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sale Summary Card */}
                <div className="card md:col-span-1">
                    <h3 className="text-lg font-bold mb-4 border-bottom pb-2">Resumen de Venta</h3>
                    <div className="mb-4">
                        <label className="text-xs text-slate-500 block uppercase font-bold">Folio Físico</label>
                        <div className="text-xl font-bold">{sale.folioFisico?.split('-D')[0]}</div>
                    </div>
                    <div className="mb-4">
                        <label className="text-xs text-slate-500 block uppercase font-bold">Total Nota</label>
                        <div className="text-xl font-mono">{formatCurrency(sale.totalVenta)}</div>
                    </div>
                    <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <label className="text-xs text-slate-500 block uppercase font-bold mb-1">Saldo Pendiente</label>
                        <div className={`text-3xl font-black ${isTotalPaid ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(sale.saldoPendiente)}
                        </div>
                        {isTotalPaid && <div className="text-xs font-bold text-success mt-1">✓ SALDADO TOTALMENTE</div>}
                    </div>
                    
                    {!isTotalPaid && (
                        <button 
                            className="btn-primary w-full" 
                            style={{ padding: '15px' }}
                            onClick={() => setShowPayModal(true)}
                        >
                            + Registrar Nuevo Abono
                        </button>
                    )}
                </div>

                {/* Payments List Table */}
                <div className="card md:col-span-2">
                    <h3 className="text-lg font-bold mb-4 border-bottom pb-2">Historial de Abonos (Ingresos)</h3>
                    <div className="table-responsive">
                        <table className="modern-table" style={{ fontSize: '0.9rem' }}>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Monto</th>
                                    <th>Método</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.abonos && sale.abonos.length > 0 ? (
                                    sale.abonos.map(p => (
                                        <tr key={p.id}>
                                            <td>{formatDateLong(p.fechaPago)}</td>
                                            <td className="font-bold text-success">{formatCurrency(p.monto)}</td>
                                            <td>{p.metodoPago}</td>
                                            <td>
                                                <button 
                                                    className="btn-icon" 
                                                    onClick={() => handleDeletePayment(p.id)}
                                                    title="Eliminar Abono"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center p-8 text-slate-400">
                                            No se han registrado abonos todavía.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Simple Modal for adding payment */}
            {showPayModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold mb-6">Registrar Abono</h3>
                        <form onSubmit={handleAddPayment}>
                            <div className="form-group">
                                <label>Monto a Pagar *</label>
                                <input 
                                    type="number" 
                                    required 
                                    className="form-input" 
                                    autoFocus
                                    value={newPayment.monto}
                                    onChange={(e) => setNewPayment({...newPayment, monto: e.target.value})}
                                />
                                <p className="text-xs text-slate-500 mt-1">Saldo restante: {formatCurrency(sale.saldoPendiente)}</p>
                            </div>
                            <div className="form-group">
                                <label>Fecha de Pago</label>
                                <input 
                                    type="date" 
                                    className="form-input" 
                                    value={newPayment.fechaPago}
                                    onChange={(e) => setNewPayment({...newPayment, fechaPago: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Método de Pago</label>
                                <select 
                                    className="form-input"
                                    value={newPayment.metodoPago}
                                    onChange={(e) => setNewPayment({...newPayment, metodoPago: e.target.value})}
                                >
                                    <option>Efectivo</option>
                                    <option>Tarjeta</option>
                                    <option>Transferencia</option>
                                </select>
                            </div>
                            <div className="flex gap-4 mt-8">
                                <button type="button" className="btn-secondary flex-1" onClick={() => setShowPayModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary flex-1">Guardar Pago</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentManagement;
