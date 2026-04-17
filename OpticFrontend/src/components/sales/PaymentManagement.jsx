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

    const goBack = () => {
        if (params?.patientId) {
            onNavigate('patient-details', { patientId: params.patientId });
        } else {
            onNavigate('sales');
        }
    };

    if (loading) return <div className="loading-container"><div className="loader"></div></div>;
    if (error) return <div className="alert alert-danger">{error} <button onClick={() => onNavigate('sales')}>Volver</button></div>;
    if (!sale) return <div className="alert alert-warning">No se encontró la venta.</div>;

    const isTotalPaid = sale.saldoPendiente <= 0;

    return (
        <div className="sales-container animate-fade-in">
            <div className="sales-header">
                <h2><span className="icon">💳</span> Gestión de Abonos</h2>
                <button className="btn-secondary" onClick={goBack}>Regresar</button>
            </div>

            <div className="card card-shadow">
                {/* Header Actions */}
                <div className="flex-between mb-8 border-bottom pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Detalle de Nota de Venta</h3>
                        {params?.patientId && (
                            <button 
                                className="text-blue-600 font-semibold text-sm hover:underline mt-4 block"
                                onClick={goBack}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                            >
                                ← Volver al Expediente del Paciente
                            </button>
                        )}
                    </div>
                </div>

                {/* Summary Grid (4 Columns) */}
                <div className="form-row-4 mb-8 bg-slate-50 p-6 rounded-xl">
                    <div>
                        <span className="tag-label block mb-1">Folio Físico</span>
                        <div className="text-2xl font-black text-slate-800">{sale.folioFisico?.split('-D')[0]}</div>
                    </div>
                    <div>
                        <span className="tag-label block mb-1">Fecha de Venta</span>
                        <div className="text-lg font-semibold text-slate-700">{formatDateLong(sale.fecha)}</div>
                    </div>
                    <div>
                        <span className="tag-label block mb-1">Total de Nota</span>
                        <div className="text-2xl font-mono font-bold text-slate-900">{formatCurrency(sale.totalVenta)}</div>
                    </div>
                    <div>
                        <span className="tag-label block mb-1">Saldo Pendiente</span>
                        <div className={`text-2xl font-mono font-black ${isTotalPaid ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(sale.saldoPendiente)}
                        </div>
                    </div>
                </div>

                {/* Observations */}
                {sale.observacionesGenerales && (
                    <div className="mb-8 p-5 bg-blue-50 border-blue-100 rounded-xl" style={{ borderLeft: '4px solid #3b82f6' }}>
                        <label className="tag-label mb-2 block">Observaciones Generales</label>
                        <div className="text-sm font-medium text-slate-700 leading-relaxed italic">
                            "{sale.observacionesGenerales}"
                        </div>
                    </div>
                )}

                {/* Products Table */}
                <div className="mb-8">
                    <h4 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-bottom">Productos / Servicios</h4>
                    <table className="modern-table">
                        <thead className="bg-slate-50">
                            <tr>
                                <th>Descripción del Item</th>
                                <th style={{ textAlign: 'right' }}>Precio Aplicado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.detalles?.map((d, i) => (
                                <tr key={i}>
                                    <td>{d.descripcionManual || 'Venta General'}</td>
                                    <td style={{ textAlign: 'right' }} className="font-mono font-bold">{formatCurrency(d.precioAplicado)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Payments History */}
                <div>
                    <div className="flex-between mb-4 pb-2 border-bottom">
                        <h4 className="text-lg font-bold text-slate-800">Historial de Abonos</h4>
                        {!isTotalPaid && (
                            <button className="btn-primary" onClick={() => setShowPayModal(true)}>
                                + Registrar Nuevo Abono
                            </button>
                        )}
                    </div>
                    <table className="modern-table">
                        <thead className="bg-slate-50">
                            <tr>
                                <th>Fecha de Pago</th>
                                <th>Método</th>
                                <th style={{ textAlign: 'right' }}>Monto</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.abonos && sale.abonos.length > 0 ? (
                                sale.abonos.map(p => (
                                    <tr key={p.id}>
                                        <td>{formatDateLong(p.fechaPago)}</td>
                                        <td>{p.metodoPago}</td>
                                        <td style={{ textAlign: 'right' }} className="font-black text-success">{formatCurrency(p.monto)}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn-icon" onClick={() => handleDeletePayment(p.id)}>🗑️</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>No hay abonos registrados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showPayModal && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in">
                        <div className="modal-header-strip"></div>
                        <h3 className="text-xl font-bold mb-6">Registrar Nuevo Abono</h3>
                        <form onSubmit={handleAddPayment}>
                            <div className="form-group">
                                <label>Monto a Pagar *</label>
                                <input 
                                    type="number" 
                                    required 
                                    className="form-input text-2xl font-mono text-success"
                                    autoFocus
                                    value={newPayment.monto}
                                    onChange={(e) => setNewPayment({...newPayment, monto: e.target.value})}
                                />
                                <div className="flex-between mt-4 text-xs font-bold text-slate-500">
                                    <span>Saldo pendiente:</span>
                                    <span>{formatCurrency(sale.saldoPendiente)}</span>
                                </div>
                            </div>
                            <div className="form-row-3">
                                <div className="form-group">
                                    <label>Fecha</label>
                                    <input type="date" className="form-input" value={newPayment.fechaPago} onChange={(e) => setNewPayment({...newPayment, fechaPago: e.target.value})} />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Método</label>
                                    <select className="form-input" value={newPayment.metodoPago} onChange={(e) => setNewPayment({...newPayment, metodoPago: e.target.value})}>
                                        <option>Efectivo</option>
                                        <option>Tarjeta</option>
                                        <option>Transferencia</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex-between mt-8" style={{ gap: '12px' }}>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowPayModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar Pago</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentManagement;
