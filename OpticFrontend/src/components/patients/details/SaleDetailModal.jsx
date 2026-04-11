import React, { useState } from 'react';
import { formatDateLong } from '../../../utils/dateUtils';
import { formatCurrency } from '../../../utils/formatUtils';
import { apiClient } from '../../../services/apiClient';
import EditSaleModal from './EditSaleModal';
import PaymentModal from './PaymentModal';

const SaleDetailModal = ({ sale, patientId, onClose, onSaleUpdated, onNavigate }) => {
    const [isEditing, setIsEditing] = useState(false);

    // State for Payment Modal (if null, modal is closed; if {}, adding new; if {...} editing existing)
    const [selectedPayment, setSelectedPayment] = useState(null);

    const handleDeletePayment = (paymentId) => {
        if (onNavigate) {
            onNavigate('payment-delete', { 
                saleId: sale.id, 
                paymentId: paymentId, 
                patientId: patientId 
            });
        }
    };

    if (!sale) return null;

    if (isEditing) {
        return (
            <EditSaleModal
                sale={sale}
                onClose={() => setIsEditing(false)}
                onSuccess={(updatedSale) => {
                    setIsEditing(false);
                    if (onSaleUpdated) onSaleUpdated(updatedSale);
                }}
            />
        );
    }

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
            <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', maxWidth: '700px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h3 style={{ margin: 0, color: '#1e293b' }}>Detalle de Venta</h3>
                        <button
                            className="btn btn-secondary text-xs py-1 px-3"
                            onClick={() => setIsEditing(true)}
                        >
                            ✏️ Editar Nota
                        </button>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer' }}>&times;</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <strong style={{ color: '#64748b', fontSize: '0.9em' }}>FOLIO:</strong>
                        <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{sale.folioFisico || 'N/A'}</div>
                    </div>
                    <div>
                        <strong style={{ color: '#64748b', fontSize: '0.9em' }}>FECHA:</strong>
                        <div>{formatDateLong(sale.fecha)}</div>
                    </div>
                    <div>
                        <strong style={{ color: '#64748b', fontSize: '0.9em' }}>TOTAL:</strong>
                        <div style={{ fontSize: '1.2em', color: '#0f172a' }}>{formatCurrency(sale.totalVenta)}</div>
                    </div>
                    <div>
                        <strong style={{ color: '#64748b', fontSize: '0.9em' }}>SALDO PENDIENTE:</strong>
                        <div style={{ fontSize: '1.2em', color: sale.saldoPendiente > 0.1 ? '#ef4444' : '#10b981' }}>
                            {formatCurrency(sale.saldoPendiente)}
                        </div>
                    </div>
                </div>

                <h4 style={{ fontSize: '1em', borderBottom: '2px solid #e2e8f0', paddingBottom: '5px', marginTop: '20px' }}>Productos / Servicios</h4>
                <table style={{ width: '100%', marginBottom: '20px', fontSize: '0.95em' }}>
                    <thead style={{ background: '#f8fafc', color: '#475569' }}>
                        <tr>
                            <th style={{ padding: '8px' }}>Descripción</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.detalles?.map((d, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px' }}>{d.descripcionManual || 'Producto sin descripción'}</td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(d.precioAplicado)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '5px' }}>
                    <h4 style={{ fontSize: '1em', margin: 0 }}>Historial de Abonos</h4>
                    <button
                        className="btn btn-primary text-xs py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-sm"
                        onClick={() => setSelectedPayment({ monto: sale.saldoPendiente })}
                    >
                        + Agregar Abono
                    </button>
                </div>
                {(!sale.abonos || sale.abonos.length === 0) ? (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No hay abonos registrados.</p>
                ) : (
                    <table style={{ width: '100%', fontSize: '0.95em' }}>
                        <thead style={{ background: '#f8fafc', color: '#475569' }}>
                            <tr>
                                <th style={{ padding: '8px' }}>Fecha</th>
                                <th style={{ padding: '8px' }}>Método</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>Monto</th>
                                <th style={{ padding: '8px', textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.abonos.map((a, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px' }}>{formatDateLong(a.fechaPago)}</td>
                                    <td style={{ padding: '8px' }}>{a.metodoPago}</td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(a.monto)}</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                        <button
                                            title="Editar"
                                            className="btn btn-ghost text-xs p-1"
                                            onClick={() => setSelectedPayment(a)}
                                        >✏️</button>
                                        <button
                                            title="Eliminar"
                                            className="btn btn-ghost text-xs p-1 ml-2"
                                            onClick={() => handleDeletePayment(a.id)}
                                        >🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" onClick={onClose}>Cerrar Visor</button>
                </div>
            </div>

            {/* PAYMENT MODAL (Add / Edit) */}
            {selectedPayment !== null && (
                <PaymentModal
                    sale={sale}
                    payment={selectedPayment}
                    onClose={() => setSelectedPayment(null)}
                    onSuccess={(updatedSale) => {
                        setSelectedPayment(null);
                        if (onSaleUpdated) onSaleUpdated(updatedSale);
                    }}
                />
            )}
        </div>
    );
};

export default SaleDetailModal;
