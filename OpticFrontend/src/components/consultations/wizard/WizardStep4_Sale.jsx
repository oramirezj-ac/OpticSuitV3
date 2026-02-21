import React, { useState, useEffect } from 'react';
import { useConsultations } from '../../../context/consultations/ConsultationsContext';
import { formatDateLong } from '../../../utils/dateUtils';
import { formatCurrency } from '../../../utils/formatUtils';
import { apiClient } from '../../../services/apiClient';

const WizardStep4_Sale = () => {
    const {
        wizardType,
        capturedData,
        setLoading,
        loading,
        error,
        setError,
        setSuccessMessage,
        prevStep
    } = useConsultations();

    const [sellers, setSellers] = useState([]);
    const [saleForm, setSaleForm] = useState({
        total_venta: '',
        observaciones: '',
        usuarioId: ''
    });

    const [paymentList, setPaymentList] = useState([]);
    const [currentPayment, setCurrentPayment] = useState({
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        metodo: 'Efectivo'
    });

    // Load available sellers (Users)
    useEffect(() => {
        const fetchSellers = async () => {
            try {
                const data = await apiClient.get('/api/users');
                setSellers(data.filter(u => u.estaActivo) || []);
            } catch (err) {
                console.error("Error loading sellers", err);
            }
        };
        fetchSellers();
    }, []);

    const PRODUCT_KEYWORDS = wizardType === 'medical'
        ? ["Consulta General", "Estudios Especiales", "Gotas Lub", "Antibiótico", "Certificado Médico", "Retiro de Cuerpo Extraño"]
        : ["Monofocal", "Progresivo", "Bifocal Flap Top", "Cr-39", "Hi-index", "Policarbonato", "Cristal", "AR", "Fotocromático", "Anti-Blue"];

    const insertKeyword = (keyword) => {
        setSaleForm(prev => ({
            ...prev,
            observaciones: prev.observaciones + (prev.observaciones ? " " : "") + keyword
        }));
    };

    const handleSaleChange = (e) => setSaleForm({ ...saleForm, [e.target.name]: e.target.value });
    const handlePaymentChange = (e) => setCurrentPayment({ ...currentPayment, [e.target.name]: e.target.value });

    const addPayment = () => {
        const monto = parseFloat(currentPayment.monto);
        if (!monto || monto <= 0) return;
        setPaymentList([...paymentList, { ...currentPayment, id: Date.now(), monto }]);
        setCurrentPayment({ ...currentPayment, monto: '' });
    };

    const removePayment = (id) => {
        setPaymentList(prev => prev.filter(p => p.id !== id));
    };

    const totalPagado = paymentList.reduce((acc, curr) => acc + curr.monto, 0);

    const handleSaveSale = async () => {
        setLoading(true);
        setError(null);
        try {
            const total = parseFloat(saleForm.total_venta) || 0;
            const saldo = total - totalPagado;

            const detalles = [];

            // Add consultation/graduation link to details if applicable
            if (wizardType === 'medical') {
                detalles.push({
                    pacienteId: capturedData.patient.id,
                    descripcionManual: "Consulta Médica",
                    precioAplicado: total
                });
            } else {
                detalles.push({
                    pacienteId: capturedData.patient.id,
                    graduacionId: capturedData.graduation?.id,
                    descripcionManual: "Lentes / Armazón",
                    precioAplicado: total
                });
            }

            const payload = {
                fecha: new Date().toISOString(), // Current timestamp
                consultaId: capturedData.consultation.id,
                totalVenta: total,
                saldoPendiente: saldo,
                observacionesGenerales: saleForm.observaciones,
                usuarioId: saleForm.usuarioId || null,
                detalles: detalles,
                abonosIniciales: paymentList.map(p => ({
                    monto: p.monto,
                    fechaPago: p.fecha,
                    metodoPago: p.metodo,
                    usuarioId: saleForm.usuarioId || null
                }))
            };

            const response = await apiClient.post('/api/sales', payload);

            setSuccessMessage("¡La Consulta y Venta se han registrado exitosamente!");
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error al guardar la venta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">Paso Final: Registro de Venta / Cobro</h4>
                    <p className="text-sm text-slate-500">Registre el costo del servicio y los abonos iniciales.</p>
                </div>
                {wizardType === 'medical' && (
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium border border-emerald-200">
                        Consulta Médica
                    </div>
                )}
            </div>

            {error && <div className="alert alert-danger mb-4">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="form-group">
                    <label className="text-sm font-semibold text-slate-700 mb-1 block">Total a Cobrar ($)</label>
                    <input
                        type="number"
                        name="total_venta"
                        className="form-input text-xl font-bold text-slate-800"
                        value={saleForm.total_venta}
                        onChange={handleSaleChange}
                        placeholder="0.00"
                        style={{ borderColor: 'var(--color-primario)' }}
                    />
                </div>
                <div className="form-group">
                    <label className="text-sm font-semibold text-slate-700 mb-1 block">Vendedor / Atiende</label>
                    <select
                        name="usuarioId"
                        className="form-select bg-slate-50 border-slate-300"
                        value={saleForm.usuarioId}
                        onChange={handleSaleChange}
                    >
                        <option value="">-- Seleccione (Opcional) --</option>
                        {sellers.map(s => (
                            <option key={s.id} value={s.id}>{s.nombreCompleto}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="form-group mb-6">
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Descripción / Concepto</label>
                <textarea
                    name="observaciones"
                    className="form-input w-full bg-slate-50 border-slate-300"
                    rows="2"
                    value={saleForm.observaciones}
                    onChange={handleSaleChange}
                    placeholder="Especifique conceptos cobrados..."
                />
                <div className="flex flex-wrap gap-2 mt-2">
                    {PRODUCT_KEYWORDS.map(kw => (
                        <button
                            key={kw}
                            type="button"
                            onClick={() => insertKeyword(kw)}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors"
                        >
                            + {kw}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <span>💳</span> Historial de Pagos / Abonos
                </h4>

                <div className="flex gap-2 mb-4 items-end">
                    <div className="flex-1">
                        <label className="text-xs text-slate-500 block mb-1">Monto ($)</label>
                        <input type="number" name="monto" className="form-input text-sm" value={currentPayment.monto} onChange={handlePaymentChange} placeholder="0.00" />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-slate-500 block mb-1">Método</label>
                        <select name="metodo" className="form-select text-sm" value={currentPayment.metodo} onChange={handlePaymentChange}>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta">Tarjeta</option>
                            <option value="Transferencia">Transferencia</option>
                        </select>
                    </div>
                    <div>
                        <button type="button" onClick={addPayment} className="btn-success text-sm py-2 px-3 h-auto">
                            + Añadir
                        </button>
                    </div>
                </div>

                {paymentList.length > 0 && (
                    <table className="w-full text-sm mb-3">
                        <tbody>
                            {paymentList.map(p => (
                                <tr key={p.id} className="border-b border-slate-100">
                                    <td className="py-2 text-slate-600">{p.metodo}</td>
                                    <td className="py-2 font-medium text-slate-800">{formatCurrency(p.monto)}</td>
                                    <td className="py-2 text-right">
                                        <button type="button" onClick={() => removePayment(p.id)} className="text-red-500 hover:text-red-700">🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-slate-200 font-bold">
                                <td className="py-2 text-right text-slate-600">Total Pagado:</td>
                                <td className="py-2 text-green-600">{formatCurrency(totalPagado)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                )}

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200">
                    <span className="font-semibold text-slate-600">Saldo Pendiente:</span>
                    <span className={`text-xl font-bold ${(parseFloat(saleForm.total_venta || 0) - totalPagado) <= 0.01 ? 'text-green-600' : 'text-red-500'}`}>
                        {formatCurrency(parseFloat(saleForm.total_venta || 0) - totalPagado)}
                    </span>
                </div>
                {(parseFloat(saleForm.total_venta || 0) - totalPagado) <= 0.01 && (
                    <div className="text-right text-success font-bold text-sm mt-1">✨ NOTA PAGADA</div>
                )}
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button className="btn-secondary" onClick={prevStep} disabled={loading}>Atrás</button>
                <button
                    className="btn-primary"
                    onClick={handleSaveSale}
                    disabled={loading || !saleForm.total_venta}
                >
                    {loading ? 'Procesando...' : 'Finalizar y Guardar Nota ✓'}
                </button>
            </div>
        </div>
    );
};

export default WizardStep4_Sale;
