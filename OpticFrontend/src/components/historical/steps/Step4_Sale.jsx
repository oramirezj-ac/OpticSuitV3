import React, { useState, useEffect } from 'react';
import { useHistoricalCapture } from '../../../context/HistoricalCaptureContext';

const Step4_Sale = () => {
    const {
        saleForm, setSaleForm,
        consultationForm,
        paymentList, setPaymentList,
        capturedData,
        setLoading, setError, setSuccessMessage, prevStep, loading
    } = useHistoricalCapture();

    // Local state for current payment input
    const [currentPayment, setCurrentPayment] = useState({
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        metodo: 'Efectivo'
    });

    const [sellers, setSellers] = useState([]);

    // Load available sellers (Users)
    useEffect(() => {
        const fetchSellers = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    // Filter active users
                    setSellers(data.filter(u => u.estaActivo));
                }
            } catch (err) {
                console.error("Error loading sellers", err);
            }
        };
        fetchSellers();
    }, []);


    // ================= PRODUCT KEYWORDS =================
    const PRODUCT_KEYWORDS = [
        "Monofocal", "Progresivo", "Bifocal Flap Top",
        "Cr-39", "Hi-index", "Policarbonato", "Cristal", "Trivex",
        "AR", "Fotocromático", "Anti-Blue",
        "En Armazón", "En Armazón de marca", "En Armazón propio"
    ];

    const insertKeyword = (keyword) => {
        setSaleForm(prev => ({
            ...prev,
            observaciones: prev.observaciones + (prev.observaciones ? " " : "") + keyword
        }));
    };

    // ================= PAYMENT CRUD STATE & HANDLERS =================
    const handlePaymentChange = (e) => setCurrentPayment({ ...currentPayment, [e.target.name]: e.target.value });

    const addPayment = () => {
        const monto = parseFloat(currentPayment.monto);
        if (!monto || monto <= 0) return;

        setPaymentList([...paymentList, { ...currentPayment, id: Date.now(), monto }]);
        setCurrentPayment({ ...currentPayment, monto: '' }); // Reset amount only
    };

    const removePayment = (id) => {
        setPaymentList(prev => prev.filter(p => p.id !== id));
    };

    const totalPagado = paymentList.reduce((acc, curr) => acc + curr.monto, 0);

    const handleSaveSale = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const total = parseFloat(saleForm.total_venta) || 0;
            const saldo = total - totalPagado;

            const payload = {
                folioFisico: saleForm.folio_fisico,
                fecha: saleForm.fecha_venta || consultationForm.fecha,
                consultaId: capturedData.consultation.id,
                totalVenta: total,
                saldoPendiente: saldo,
                observacionesGenerales: saleForm.observaciones,
                usuarioId: saleForm.usuarioId ? saleForm.usuarioId : null, // Send selected seller
                detalles: [
                    {
                        pacienteId: capturedData.patient.id,
                        graduacionId: capturedData.graduation.id,
                        descripcionManual: "Captura Histórica - Lentes Completos",
                        precioAplicado: total
                    }
                ],
                // Map the full list of payments
                abonosIniciales: paymentList.map(p => ({
                    monto: p.monto,
                    fechaPago: p.fecha,
                    metodoPago: p.metodo,
                    usuarioId: saleForm.usuarioId ? saleForm.usuarioId : null // Credit payment to same seller
                }))
            };

            if (!capturedData.consultation?.id || !capturedData.graduation?.id || !capturedData.patient?.id) {
                throw new Error("Faltan datos requeridos (Consulta, Graduación o Paciente). Por favor verifique los pasos anteriores.");
            }

            // Optional Validation: Require Seller for High Value or Branded items?
            // For now, prompt warning if not selected but allow if backend permits?
            // Let's assume it's better to be strict if user asked for it.
            if (!saleForm.usuarioId) {
                // We'll allow it for now to avoid blocking if backend allows null, 
                // but UI shows it's important.
            }

            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Error al guardar venta: ${errText}`);
            }

            setSuccessMessage("¡Captura de Nota Histórica Completa!");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaleChange = (e) => setSaleForm({ ...saleForm, [e.target.name]: e.target.value });

    return (
        <div className="step-sale">
            <h3>Paso 4: Datos de Venta</h3>
            <div className="alert alert-info" style={{ fontSize: '0.9em' }}>
                ℹ️ Capture el historial financiero. Seleccione el vendedor responsable.
            </div>

            {/* SALES HEADER INFO */}
            <div className="form-row">
                <div className="form-group">
                    <label>Folio Físico (Nota)</label>
                    <input
                        type="text"
                        name="folio_fisico"
                        className="form-input"
                        value={saleForm.folio_fisico}
                        onChange={handleSaleChange}
                        placeholder="Ej: 0001"
                    />
                </div>
                <div className="form-group">
                    <label>Fecha de Venta</label>
                    <input
                        type="date"
                        name="fecha_venta"
                        className="form-input"
                        value={saleForm.fecha_venta || consultationForm.fecha}
                        onChange={handleSaleChange}
                    />
                </div>
                <div className="form-group">
                    <label>Vendedor (Responsable)</label>
                    <select
                        name="usuarioId"
                        className="form-input"
                        value={saleForm.usuarioId}
                        onChange={handleSaleChange}
                        style={{ borderLeft: '4px solid #3b82f6' }}
                    >
                        <option value="">-- Seleccione Vendedor --</option>
                        {sellers.map(s => (
                            <option key={s.id} value={s.id}>{s.nombreCompleto}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* PRODUCT DESCRIPTION + KEYWORDS */}
            <div className="product-section" style={{ marginBottom: '20px' }}>
                <div className="form-group">
                    <label>Total Venta ($)</label>
                    <input
                        type="number"
                        name="total_venta"
                        className="form-input"
                        value={saleForm.total_venta}
                        onChange={handleSaleChange}
                        placeholder="0.00"
                        style={{ fontWeight: 'bold', fontSize: '1.2em', color: '#0f172a' }}
                    />
                </div>

                <div className="form-group">
                    <label>Descripción del Producto / Tratamientos</label>
                    <textarea
                        name="observaciones"
                        className="form-input"
                        rows="3"
                        value={saleForm.observaciones}
                        onChange={handleSaleChange}
                        placeholder="Especifique armazón, micas, tratamientos..."
                    />
                    <div className="keywords-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                        {PRODUCT_KEYWORDS.map(kw => (
                            <button
                                key={kw}
                                type="button"
                                onClick={() => insertKeyword(kw)}
                                className="badge-keyword"
                                style={{
                                    background: '#e2e8f0', border: 'none', borderRadius: '12px',
                                    padding: '4px 10px', fontSize: '0.8em', cursor: 'pointer', color: '#475569'
                                }}
                            >
                                + {kw}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* PAYMENTS CRUD PANEL */}
            <div className="payments-panel" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '1em', marginBottom: '10px', borderBottom: '1px solid #cbd5e1', paddingBottom: '5px' }}>
                    💳 Historial de Pagos / Abonos
                </h4>

                {/* ADD PAYMENT FORM */}
                <div className="add-payment-form" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8em' }}>Fecha Pago</label>
                        <input type="date" name="fecha" className="form-input-sm" value={currentPayment.fecha} onChange={handlePaymentChange} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8em' }}>Monto ($)</label>
                        <input type="number" name="monto" className="form-input-sm" value={currentPayment.monto} onChange={handlePaymentChange} placeholder="0.00" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8em' }}>Método</label>
                        <select name="metodo" className="form-input-sm" value={currentPayment.metodo} onChange={handlePaymentChange}>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta">Tarjeta</option>
                            <option value="Transferencia">Transferencia</option>
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={addPayment}
                        className="btn-add-payment"
                        style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 12px', cursor: 'pointer' }}
                    >
                        + Agregar
                    </button>
                </div>

                {/* PAYMENTS LIST TABLE */}
                {paymentList.length > 0 && (
                    <table className="table-mini" style={{ width: '100%', fontSize: '0.9em', marginBottom: '10px' }}>
                        <thead>
                            <tr style={{ background: '#e2e8f0' }}>
                                <th>Fecha</th>
                                <th>Método</th>
                                <th>Monto</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentList.map(p => (
                                <tr key={p.id}>
                                    <td>{new Date(p.fecha).toLocaleDateString()}</td>
                                    <td>{p.metodo}</td>
                                    <td>${p.monto.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            type="button"
                                            onClick={() => removePayment(p.id)}
                                            style={{ color: 'red', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ borderTop: '2px solid #cbd5e1', fontWeight: 'bold' }}>
                                <td colSpan="2" style={{ textAlign: 'right' }}>Total Pagado:</td>
                                <td>${totalPagado.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                )}

                {/* BALANCE DISPLAY */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                    <span style={{ color: '#64748b', marginRight: '10px' }}>Saldo Pendiente:</span>
                    <span style={{
                        fontSize: '1.4em',
                        fontWeight: 'bold',
                        color: (parseFloat(saleForm.total_venta || 0) - totalPagado) <= 0.01 ? 'green' : '#e11d48'
                    }}>
                        ${(parseFloat(saleForm.total_venta || 0) - totalPagado).toFixed(2)}
                    </span>
                </div>
                {(parseFloat(saleForm.total_venta || 0) - totalPagado) <= 0.01 && (
                    <div style={{ textAlign: 'right', color: 'green', fontWeight: 'bold', fontSize: '0.8em' }}>✨ NOTA PAGADA</div>
                )}
            </div>

            <div className="form-actions">
                <button className="btn-secondary" onClick={prevStep}>Atrás</button>
                <button className="btn-primary" onClick={handleSaveSale} disabled={loading}>
                    {loading ? 'Procesando...' : 'Finalizar y Guardar Nota'}
                </button>
            </div>
        </div>
    );
};

export default Step4_Sale;
