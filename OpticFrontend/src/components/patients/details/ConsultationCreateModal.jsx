import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { apiClient } from '../../../services/apiClient';
import { authService } from '../../../services/authService';
import SuccessOverlay from '../../common/SuccessOverlay';
import '../../consultations/ConsultationCreate.css';

const ConsultationCreateModal = ({ patientId, patientName, tipoConsulta, defaultDate, onClose, onSuccess, onNavigateGraduations }) => {
    const [form, setForm] = useState({
        fecha: defaultDate || new Date().toISOString().split('T')[0],
        motivoConsulta: tipoConsulta === 'consulta_lentes' ? 'Revisar graduación' : 'Revisión Médica',
        observaciones: '',
        diagnostico: '',
        tratamiento: '',
        costoServicio: tipoConsulta === 'consulta_medica' ? 300 : 0
    });

    // Pharmacy state (Medical only)
    const [selectedProducts, setSelectedProducts] = useState([]);
    const pharmacyCatalog = [
        { id: 'hipromelosa', name: 'Hipromelosa', price: 100, reason: 'Ojo Seco' },
        { id: 'splash', name: 'Splash', price: 200, reason: 'Ojo Seco' },
        { id: 'hamamelis', name: 'Hamamelis', price: 300, reason: 'Carnosidad' },
        { id: 'ocurelift', name: 'Ocurelift', price: 100, reason: 'Ojo Rojo' }
    ];

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [metodoPago, setMetodoPago] = useState('Efectivo');

    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const toggleProduct = (prod) => {
        if (selectedProducts.find(p => p.id === prod.id)) {
            setSelectedProducts(selectedProducts.filter(p => p.id !== prod.id));
        } else {
            setSelectedProducts([...selectedProducts, prod]);
        }
    };

    const calculateTotal = () => {
        const productTotal = selectedProducts.reduce((sum, p) => sum + p.price, 0);
        return parseFloat(form.costoServicio || 0) + productTotal;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const detallesClinicos = tipoConsulta === 'consulta_medica' ? {
                diagnostico: form.diagnostico,
                tratamiento: form.tratamiento,
                productos: selectedProducts.map(p => p.name).join(', ')
            } : {};

            const total = calculateTotal();

            const payload = {
                pacienteId: patientId,
                fecha: form.fecha ? new Date(form.fecha + 'T00:00:00Z').toISOString() : new Date().toISOString(),
                tipoConsulta,
                motivoConsulta: form.motivoConsulta,
                observaciones: form.observaciones,
                costoServicio: total,
                estadoFinanciero: total > 0 ? 'pagado' : 'completo',
                detallesClinicos
            };

            const response = await apiClient.post('/api/consultations', payload);

            // AUTOMATIC SALE CREATION if total > 0
            if (total > 0) {
                const saleDate = form.fecha ? new Date(form.fecha + 'T00:00:00Z').toISOString() : new Date().toISOString();

                const prefix = tipoConsulta === 'consulta_medica' ? 'MED-' : 'CL-';

                const salePayload = {
                    pacienteId: patientId,
                    consultaId: response.id,
                    folioFisico: `${prefix}${form.fecha.replace(/-/g, '')}`,
                    fecha: saleDate,
                    totalVenta: total,
                    saldoPendiente: 0,
                    observacionesGenerales: `Cobro por ${tipoConsulta === 'consulta_medica' ? 'Consulta Médica' : 'Graduación'}`,
                    usuarioId: null,
                    detalles: [
                        { descripcion: `${tipoConsulta === 'consulta_medica' ? 'Consulta Médica' : 'Graduación'}: ${form.motivoConsulta}`, cantidad: 1, precioAplicado: parseFloat(form.costoServicio || 0) },
                        ...selectedProducts.map(p => ({
                            descripcion: `Farmacia: ${p.name}`,
                            cantidad: 1,
                            precioAplicado: p.price
                        }))
                    ],
                    abonosIniciales: [
                        { monto: total, metodoPago: metodoPago, fechaPago: saleDate, usuarioId: null }
                    ]
                };
                await apiClient.post('/api/sales', salePayload);
            }

            setShowSuccess(true);
            setTimeout(() => {
                if (tipoConsulta === 'consulta_lentes' && onNavigateGraduations) {
                    onNavigateGraduations(response.id);
                } else {
                    onSuccess();
                }
            }, 1500);
        } catch (err) {
            console.error("Error saving consultation:", err);
            setError(err.message || "Error al guardar la consulta");
        } finally {
            setLoading(false);
        }
    };

    const isMedical = tipoConsulta === 'consulta_medica';
    const total = calculateTotal();

    const modalContent = (
        <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '750px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <SuccessOverlay show={showSuccess} message="Consulta Registrada con Éxito" />

                {/* Header */}
                <div className="modal-header">
                    <h3>{isMedical ? '🩺 Nueva Consulta Médica' : '👓 Nueva Consulta de Lentes'}</h3>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                {/* Body */}
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div className="modal-body" style={{ overflowY: 'auto', padding: '20px' }}>
                        {error && <div className="alert alert-danger">{error}</div>}

                        {/* Patient Banner */}
                        <div style={{ padding: '10px 15px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '20px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: '600' }}>Paciente: </span>
                            <span style={{ fontSize: '1rem', fontWeight: '700', color: '#0c4a6e' }}>{patientName}</span>
                        </div>

                        {/* Row: Fecha + Motivo */}
                        <div className="form-row">
                            <div className="form-group col" style={{ padding: '5px', flex: 1 }}>
                                <label>Fecha de Consulta</label>
                                <input type="date" name="fecha" className="form-input" value={form.fecha} onChange={handleFormChange} required />
                            </div>
                            <div className="form-group col" style={{ padding: '5px', flex: 2 }}>
                                <label>Motivo de Consulta</label>
                                <input type="text" name="motivoConsulta" className="form-input" value={form.motivoConsulta} onChange={handleFormChange} required />
                            </div>
                        </div>

                        {/* Row: Costo */}
                        <div className="form-row">
                            <div className="form-group col" style={{ padding: '5px' }}>
                                <label>Costo de Consulta / Servicio ($)</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input type="number" name="costoServicio" className="form-input" style={{ flex: 1 }} value={form.costoServicio} onChange={handleFormChange} onWheel={(e) => e.target.blur()} />
                                    {isMedical ? (
                                        <>
                                            <button type="button" className="btn-action-small" onClick={() => setForm({ ...form, costoServicio: 0 })}>Cortesía</button>
                                            <button type="button" className="btn-action-small" onClick={() => setForm({ ...form, costoServicio: 0 })}>Seguimiento</button>
                                        </>
                                    ) : (
                                        <button type="button" className="btn-action-small" onClick={() => setForm({ ...form, costoServicio: 300 })}>Solo Graduación ($300)</button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Medical-only fields */}
                        {isMedical && (
                            <>
                                <div style={{ padding: '5px', marginTop: '10px' }}>
                                    <label style={{ marginBottom: '10px', display: 'block', fontWeight: '700', color: '#334155' }}>Productos de Farmacia</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                        {pharmacyCatalog.map(prod => (
                                            <div
                                                key={prod.id}
                                                className={`pharmacy-card p-3 border rounded-lg cursor-pointer transition-all ${selectedProducts.find(p => p.id === prod.id) ? 'active' : ''}`}
                                                onClick={() => toggleProduct(prod)}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase' }}>{prod.reason}</span>
                                                    <div className={`check-pill ${selectedProducts.find(p => p.id === prod.id) ? 'show' : ''}`}>✓</div>
                                                </div>
                                                <div style={{ fontWeight: '700', color: '#1e293b' }}>{prod.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '700' }}>${prod.price}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-row" style={{ marginTop: '10px' }}>
                                    <div className="form-group col" style={{ padding: '5px' }}>
                                        <label>Diagnóstico</label>
                                        <input type="text" name="diagnostico" className="form-input" value={form.diagnostico} onChange={handleFormChange} placeholder="Ej. Conjuntivitis, Blefaritis..." required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group col" style={{ padding: '5px' }}>
                                        <label>Tratamiento / Receta</label>
                                        <textarea name="tratamiento" className="form-input" rows="2" value={form.tratamiento} onChange={handleFormChange} required />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Observaciones */}
                        <div className="form-row">
                            <div className="form-group col" style={{ padding: '5px' }}>
                                <label>Observaciones Generales</label>
                                <textarea name="observaciones" className="form-input" rows="2" value={form.observaciones} onChange={handleFormChange} />
                            </div>
                        </div>

                        {/* Total + Payment Method */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6', marginTop: '15px' }}>
                            <div>
                                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#1e293b' }}>Total: <span style={{ color: '#2563eb' }}>${total}</span></div>
                                {total > 0 && <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Se generará nota auto-pagada</div>}
                            </div>
                            {total > 0 && (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {['Efectivo', 'Tarjeta', 'Transferencia'].map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            className={`payment-method-btn ${metodoPago === m ? 'active' : ''}`}
                                            onClick={() => setMetodoPago(m)}
                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : (total > 0 ? 'Finalizar y Cobrar ➔' : 'Finalizar Consulta ➔')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default ConsultationCreateModal;
