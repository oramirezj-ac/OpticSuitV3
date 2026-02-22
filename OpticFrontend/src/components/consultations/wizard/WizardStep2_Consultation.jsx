import React, { useState } from 'react';
import { useConsultations } from '../../../context/consultations/ConsultationsContext';
import { apiClient } from '../../../services/apiClient';

const WizardStep2_Consultation = () => {
    const {
        wizardType,
        capturedData,
        setCapturedData,
        nextStep,
        setLoading,
        loading,
        error,
        setError
    } = useConsultations();

    const [form, setForm] = useState({
        motivoConsulta: wizardType === 'medical' ? 'Revisión Médica' : 'Refracción',
        observaciones: '',
        diagnostico: '', // Only for medical
        tratamiento: '', // Only for medical
    });

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            // For medical consultations, we store diagnosic and treatment in DetallesClinicos JSONB
            const detallesClinicos = wizardType === 'medical' ? {
                diagnostico: form.diagnostico,
                tratamiento: form.tratamiento
            } : {};

            const payload = {
                pacienteId: capturedData.patient.id,
                fecha: new Date().toISOString(),
                tipoConsulta: wizardType === 'medical' ? 'consulta_medica' : 'consulta_lentes',
                motivoConsulta: form.motivoConsulta,
                observaciones: form.observaciones,
                estadoFinanciero: 'pendiente',
                detallesClinicos: JSON.stringify(detallesClinicos)
            };

            const response = await apiClient.post('/api/consultations', payload);

            setCapturedData(prev => ({ ...prev, consultation: response }));
            nextStep(); // Move to Step 3
        } catch (err) {
            console.error("Failed to save consultation:", err);
            setError(err.message || 'Error al guardar la consulta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">Paso 2: Detalles de la Consulta</h4>
                    <p className="text-sm text-slate-500">
                        Paciente seleccionado: <strong className="text-slate-700">{capturedData.patient?.nombre} {capturedData.patient?.apellidoPaterno}</strong>
                    </p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                    {wizardType === 'medical' ? 'Consulta Médica' : 'Consulta Refractiva'}
                </div>
            </div>

            {error && <div className="alert alert-danger mb-4">{error}</div>}

            <div className="space-y-4">
                <div className="form-group">
                    <label className="text-sm font-semibold text-slate-700 mb-1 block">Motivo de la Consulta</label>
                    <input
                        type="text"
                        name="motivoConsulta"
                        className="form-input w-full"
                        value={form.motivoConsulta}
                        onChange={handleChange}
                        placeholder={wizardType === 'medical' ? 'Ej. Dolor ocular, Infección, Revisión...' : 'Ej. Lentes nuevos, Lentes rotos, Cambio de graduación...'}
                        required
                    />
                </div>

                {wizardType === 'medical' && (
                    <>
                        <div className="form-group">
                            <label className="text-sm font-semibold text-slate-700 mb-1 block">Diagnóstico Principal</label>
                            <input
                                type="text"
                                name="diagnostico"
                                className="form-input w-full"
                                value={form.diagnostico}
                                onChange={handleChange}
                                placeholder="Ej. Conjuntivitis Bacteriana"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="text-sm font-semibold text-slate-700 mb-1 block">Tratamiento Indicado</label>
                            <textarea
                                name="tratamiento"
                                className="form-input w-full"
                                rows="3"
                                value={form.tratamiento}
                                onChange={handleChange}
                                placeholder="Ej. Aplicar gotas 3 veces al día..."
                                required
                            />
                        </div>
                    </>
                )}

                <div className="form-group">
                    <label className="text-sm font-semibold text-slate-700 mb-1 block">
                        {wizardType === 'medical' ? 'Observaciones / Anotaciones Adicionales' : 'Observaciones'}
                    </label>
                    <textarea
                        name="observaciones"
                        className="form-input w-full"
                        rows="3"
                        value={form.observaciones}
                        onChange={handleChange}
                        placeholder="Cualquier nota adicional relevante..."
                    />
                </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-4">
                {/* No "Atrás" button implemented strictly here as they would lose the selected patient context unless we manage it. Since patient is in context, we could go back. Let's add it for better UX. */}
                <button
                    className="btn-secondary"
                    onClick={() => useConsultations().prevStep()}
                    disabled={loading}
                >
                    Atrás
                </button>
                <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={loading || !form.motivoConsulta || (wizardType === 'medical' && (!form.diagnostico || !form.tratamiento))}
                >
                    {loading ? 'Guardando...' : 'Guardar y Continuar ➜'}
                </button>
            </div>
        </div>
    );
};

export default WizardStep2_Consultation;
