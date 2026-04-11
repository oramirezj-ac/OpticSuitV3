import React, { useState, useEffect } from 'react';
import { useHistoricalCapture } from '../../../context/HistoricalCaptureContext';
import { authService } from '../../../services/authService';
import { formatDateLong } from '../../../utils/dateUtils';
import { formatCurrency } from '../../../utils/formatUtils';

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

    // Commission State
    const [commissionSettings, setCommissionSettings] = useState({
        amount: '',
        vendor1: '',
        vendor2: '',
        showShared: false
    });

    const handleCommissionChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCommissionSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Load available sellers (Users)
    useEffect(() => {
        const fetchSellers = async () => {
            try {
                const token = authService.getToken();
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
    const PRODUCT_CATEGORIES = {
        "Lentes": ["Monofocal", "Progresivo", "Bifocal Flap Top"],
        "Materiales": ["Cr-39", "Hi-index", "Policarbonato", "Cristal", "Trivex"],
        "Tratamientos": ["AR", "Fotocromático", "Anti-Blue"],
        "Armazón": ["En Armazón", "En Armazón de marca", "En Armazón propio"]
    };

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
            const token = authService.getToken();
            const total = parseFloat(saleForm.total_venta) || 0;
            const saldo = total - totalPagado;

            let comisionesPayload = [];
            const dAmount = parseFloat(commissionSettings.amount) || 0;
            if (dAmount > 0 && commissionSettings.vendor1) {
                if (commissionSettings.showShared && commissionSettings.vendor2) {
                    // Split 50/50
                    const split = dAmount / 2;
                    comisionesPayload.push({ usuarioId: commissionSettings.vendor1, montoComision: split, puntosVenta: 0 });
                    if (commissionSettings.vendor1 !== commissionSettings.vendor2) {
                        comisionesPayload.push({ usuarioId: commissionSettings.vendor2, montoComision: split, puntosVenta: 0 });
                    }
                } else {
                    // 100% to vendor 1
                    comisionesPayload.push({ usuarioId: commissionSettings.vendor1, montoComision: dAmount, puntosVenta: 0 });
                }
            }

            const payload = {
                folioFisico: saleForm.folio_fisico,
                fecha: saleForm.fecha_venta || consultationForm.fecha,
                consultaId: capturedData.consultation.id,
                totalVenta: total,
                saldoPendiente: saldo,
                observacionesGenerales: saleForm.observaciones,
                usuarioId: null, // Vendedores puros opcionales vía comisión ahora
                detalles: [
                    {
                        pacienteId: capturedData.patient.id,
                        graduacionId: capturedData.graduation.id,
                        descripcionManual: "Captura Histórica - Lentes Completos",
                        precioAplicado: total
                    }
                ],
                abonosIniciales: paymentList.map(p => ({
                    monto: p.monto,
                    fechaPago: p.fecha,
                    metodoPago: p.metodo,
                    usuarioId: null
                })),
                comisiones: comisionesPayload
            };

            if (!capturedData.consultation?.id || !capturedData.graduation?.id || !capturedData.patient?.id) {
                throw new Error("Faltan datos requeridos (Consulta, Graduación o Paciente). Por favor verifique los pasos anteriores.");
            }

            if (dAmount > 0 && !commissionSettings.vendor1) {
                throw new Error("Se especificó un fondo de comisión pero no se seleccionó al Vendedor Principal.");
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
        <div className="step-sale fade-in">
            <div className="alert alert-info flex items-center gap-2">
                <span className="text-xl">ℹ️</span>
                <span>Capture el historial financiero. La selección de vendedor es opcional (solo para comisiones).</span>
            </div>

            {/* SALES HEADER INFO */}
            <div className="grid-cols-3 mb-4">
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
                <div className="form-group flex-col">
                    <label>Fondo de Comisión Extra ($)</label>
                    <input
                        type="number"
                        name="amount"
                        className="form-input"
                        value={commissionSettings.amount}
                        onChange={handleCommissionChange}
                        placeholder="0.00"
                        style={{ borderLeft: '4px solid var(--color-secundario)' }}
                    />
                    <small className="text-muted mt-1 text-xs">Dejar en 0 si no aplica comisión a secretarias.</small>
                </div>
            </div>

            {/* CONDITIONAL VENDORS BLOCK */}
            {parseFloat(commissionSettings.amount) > 0 && (
                <div className="p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg animate-fade-in" style={{ backgroundColor: '#fefce8', borderColor: '#fef08a' }}>
                    <h5 className="font-semibold text-yellow-800 mb-3 block">⚖️ Distribución de Comisión</h5>
                    <div className="grid-cols-2">
                        <div className="form-group">
                            <label className="text-yellow-900 font-medium">Vendedora Principal</label>
                            <select
                                name="vendor1"
                                className="form-select bg-white"
                                value={commissionSettings.vendor1}
                                onChange={handleCommissionChange}
                            >
                                <option value="">-- Seleccione vendedora --</option>
                                {sellers.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombreCompleto}</option>
                                ))}
                            </select>
                            {!commissionSettings.showShared && commissionSettings.vendor1 && (
                                <p className="text-xs text-yellow-700 font-medium mt-1">Recibirá el 100% (${(parseFloat(commissionSettings.amount) || 0).toFixed(2)})</p>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="text-yellow-900 font-medium inline-flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    name="showShared" 
                                    checked={commissionSettings.showShared}
                                    onChange={handleCommissionChange} 
                                    className="rounded border-gray-300"
                                />
                                Añadir vendedora compartida (Dividir 50/50)
                            </label>
                            
                            {commissionSettings.showShared && (
                                <div className="mt-2 animate-fade-in">
                                    <select
                                        name="vendor2"
                                        className="form-select bg-white"
                                        value={commissionSettings.vendor2}
                                        onChange={handleCommissionChange}
                                    >
                                        <option value="">-- Seleccione secundaria --</option>
                                        {sellers.map(s => (
                                            <option key={s.id} value={s.id}>{s.nombreCompleto}</option>
                                        ))}
                                    </select>
                                    {commissionSettings.vendor1 && commissionSettings.vendor2 && (
                                        <p className="text-xs text-yellow-700 font-medium mt-1">
                                            Ambas recibirán el 50% (${((parseFloat(commissionSettings.amount) || 0) / 2).toFixed(2)})
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCT DESCRIPTION + KEYWORDS */}
            <div className="mb-4">
                <div className="form-group">
                    <label>Total Venta ($)</label>
                    <input
                        type="number"
                        name="total_venta"
                        className="form-input text-xl font-bold"
                        value={saleForm.total_venta}
                        onChange={handleSaleChange}
                        placeholder="0.00"
                    />
                </div>

                <div className="form-group">
                    <label>Descripción del Producto / Tratamientos</label>
                    <textarea
                        name="observaciones"
                        className="form-textarea"
                        rows="3"
                        value={saleForm.observaciones}
                        onChange={handleSaleChange}
                        placeholder="Especifique armazón, micas, tratamientos..."
                    />
                    <div className="flex flex-col gap-3 mt-3">
                        {Object.entries(PRODUCT_CATEGORIES).map(([category, keywords]) => (
                            <div key={category} className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500 uppercase w-24">
                                    {category}:
                                </span>
                                {keywords.map(kw => (
                                    <button
                                        key={kw}
                                        type="button"
                                        onClick={() => insertKeyword(kw)}
                                        className="badge badge-light"
                                        style={{ border: '1px solid var(--slate-300)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                        onMouseOver={(e) => Object.assign(e.target.style, { background: 'var(--slate-200)', borderColor: 'var(--slate-400)' })}
                                        onMouseOut={(e) => Object.assign(e.target.style, { background: 'var(--slate-100)', borderColor: 'var(--slate-300)' })}
                                    >
                                        + {kw}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* PAYMENTS CRUD PANEL */}
            <div className="card" style={{ backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', padding: 'var(--spacing-md)' }}>
                <h4 className="text-lg font-semibold border-b border-slate-300 pb-2 mb-4 flex items-center gap-2">
                    <span>💳</span> Historial de Pagos / Abonos
                </h4>

                {/* ADD PAYMENT FORM */}
                <div className="grid-cols-4 items-end mb-4">
                    <div className="form-group">
                        <label className="text-sm">Fecha Pago</label>
                        <input type="date" name="fecha" className="form-input text-sm" value={currentPayment.fecha} onChange={handlePaymentChange} />
                    </div>
                    <div className="form-group">
                        <label className="text-sm">Monto ($)</label>
                        <input type="number" name="monto" className="form-input text-sm" value={currentPayment.monto} onChange={handlePaymentChange} placeholder="0.00" />
                    </div>
                    <div className="form-group">
                        <label className="text-sm">Método</label>
                        <select name="metodo" className="form-select text-sm" value={currentPayment.metodo} onChange={handlePaymentChange}>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta">Tarjeta</option>
                            <option value="Transferencia">Transferencia</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <button
                            type="button"
                            onClick={addPayment}
                            className="btn btn-success w-full text-sm"
                        >
                            + Agregar
                        </button>
                    </div>
                </div>

                {/* PAYMENTS LIST TABLE */}
                {paymentList.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm mb-4" style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-left">
                                    <th className="p-2 font-semibold text-muted">Fecha</th>
                                    <th className="p-2 font-semibold text-muted">Método</th>
                                    <th className="p-2 font-semibold text-muted">Monto</th>
                                    <th className="p-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentList.map(p => (
                                    <tr key={p.id} className="border-b border-slate-100 hover:bg-white">
                                        <td className="p-2">{formatDateLong(p.fecha)}</td>
                                        <td className="p-2">{p.metodo}</td>
                                        <td className="p-2 font-medium">{formatCurrency(p.monto)}</td>
                                        <td className="p-2 text-right">
                                            <button
                                                type="button"
                                                onClick={() => removePayment(p.id)}
                                                className="btn-ghost text-danger p-1 rounded"
                                                title="Eliminar pago"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-300 font-bold">
                                    <td colSpan="2" className="p-2 text-right">Total Pagado:</td>
                                    <td className="p-2">{formatCurrency(totalPagado)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* BALANCE DISPLAY */}
                <div className="flex justify-end items-center mt-4 pt-4 border-t border-dashed border-slate-300">
                    <span className="text-muted mr-4">Saldo Pendiente:</span>
                    <span
                        className={`text-2xl font-bold ${(parseFloat(saleForm.total_venta || 0) - totalPagado) <= 0.01 ? 'text-success' : 'text-danger'}`}
                    >
                        {formatCurrency(parseFloat(saleForm.total_venta || 0) - totalPagado)}
                    </span>
                </div>
                {(parseFloat(saleForm.total_venta || 0) - totalPagado) <= 0.01 && (
                    <div className="text-right text-success font-bold text-sm mt-1">✨ NOTA PAGADA</div>
                )}
            </div>

            <div className="form-actions">
                <button className="btn btn-secondary" onClick={prevStep}>Atrás</button>
                <button className="btn btn-primary" onClick={handleSaveSale} disabled={loading}>
                    {loading ? 'Procesando...' : 'Finalizar y Guardar Nota'}
                </button>
            </div>
        </div>
    );
};

export default Step4_Sale;
