import React, { useState } from 'react';
import { formatDateLong } from '../../../utils/dateUtils';
import { apiClient } from '../../../services/apiClient';

const MedicalCheckoutModal = ({ consultation, patientId, onClose, onSuccess }) => {
    const [costoConsulta, setCostoConsulta] = useState(consultation?.costoServicio || 0);
    const [medicamentosCosto, setMedicamentosCosto] = useState(0);
    const [medicamentosDesc, setMedicamentosDesc] = useState('');
    const [metodoPago, setMetodoPago] = useState('Efectivo');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!consultation) return null;

    const total = parseFloat(costoConsulta || 0) + parseFloat(medicamentosCosto || 0);

    const handleAceptar = async () => {
        setLoading(true);
        setError(null);
        try {
            const detalles = [];

            // Add Consultation fee if > 0
            if (parseFloat(costoConsulta) > 0) {
                detalles.push({
                    pacienteId: patientId,
                    descripcionManual: `Cobro por Consulta Médica: ${consultation.motivoConsulta}`,
                    precioAplicado: parseFloat(costoConsulta)
                });
            }

            // Add Medications if > 0
            if (parseFloat(medicamentosCosto) > 0) {
                detalles.push({
                    pacienteId: patientId,
                    descripcionManual: `Venta de Medicamentos: ${medicamentosDesc || 'Varios'}`,
                    precioAplicado: parseFloat(medicamentosCosto)
                });
            }

            // If everything is 0, we shouldn't save a sale maybe, but let's allow 0 value sales or error out
            if (total === 0) {
                throw new Error("El total a cobrar no puede ser cero.");
            }

            const payload = {
                consultaId: consultation.id,
                folioFisico: `MED-${consultation.id.substring(0, 6).toUpperCase()}`,
                fecha: new Date().toISOString(),
                totalVenta: total,
                saldoPendiente: 0, // Assume full payment for express medical
                observacionesGenerales: "Cobro rápido de Consulta Médica",
                detalles: detalles,
                abonosIniciales: [
                    {
                        monto: total,
                        fechaPago: new Date().toISOString(),
                        metodoPago: metodoPago
                    }
                ]
            };

            const response = await apiClient.post('/api/sales', payload);
            if (response && response.id) {
                onSuccess();
            } else {
                throw new Error("La respuesta del servidor no fue válida.");
            }

        } catch (err) {
            console.error(err);
            setError(err.message || 'Ocurrió un error al procesar el cobro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Cobro de Consulta Médica</h3>
                        <p className="text-sm text-slate-500">
                            {formatDateLong(consultation.fecha)} - {consultation.motivoConsulta}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto bg-white flex-1 relative">
                    {error && (
                        <div className="alert alert-danger mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="form-group">
                            <label className="text-sm font-semibold text-slate-700 block mb-1">
                                Costo de Consulta ($)
                            </label>
                            <input
                                type="number"
                                className="form-input w-full"
                                value={costoConsulta}
                                onChange={(e) => setCostoConsulta(e.target.value)}
                                min="0" step="0.01"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="text-sm font-semibold text-slate-700 block mb-1">
                                    Extra: Medicamentos ($)
                                </label>
                                <input
                                    type="number"
                                    className="form-input w-full"
                                    value={medicamentosCosto}
                                    onChange={(e) => setMedicamentosCosto(e.target.value)}
                                    min="0" step="0.01"
                                />
                            </div>
                            <div className="form-group">
                                <label className="text-sm font-semibold text-slate-700 block mb-1">
                                    Detalle Medicamento
                                </label>
                                <input
                                    type="text"
                                    className="form-input w-full"
                                    placeholder="Ej. Gotas lubricantes"
                                    value={medicamentosDesc}
                                    onChange={(e) => setMedicamentosDesc(e.target.value)}
                                    disabled={parseFloat(medicamentosCosto || 0) <= 0}
                                />
                            </div>
                        </div>

                        <div className="form-group pt-2 border-t border-slate-100">
                            <label className="text-sm font-semibold text-slate-700 block mb-2">Método de Pago</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="metodoMed" value="Efectivo"
                                        checked={metodoPago === 'Efectivo'}
                                        onChange={(e) => setMetodoPago(e.target.value)}
                                        className="text-blue-600 focus:ring-blue-500" />
                                    <span className="text-sm text-slate-700">Efectivo</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="metodoMed" value="Tarjeta"
                                        checked={metodoPago === 'Tarjeta'}
                                        onChange={(e) => setMetodoPago(e.target.value)}
                                        className="text-blue-600 focus:ring-blue-500" />
                                    <span className="text-sm text-slate-700">Tarjeta</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="metodoMed" value="Transferencia"
                                        checked={metodoPago === 'Transferencia'}
                                        onChange={(e) => setMetodoPago(e.target.value)}
                                        className="text-blue-600 focus:ring-blue-500" />
                                    <span className="text-sm text-slate-700">Transferencia</span>
                                </label>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Total a Cobrar</span>
                        <span className="text-2xl font-bold text-slate-800">
                            ${total.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            className="btn btn-secondary px-4 py-2 text-sm"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 border-none px-6 py-2 text-sm shadow-sm"
                            onClick={handleAceptar}
                            disabled={loading || total <= 0}
                        >
                            {loading ? 'Procesando...' : 'Confirmar Cobro'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MedicalCheckoutModal;
