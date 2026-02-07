import React, { useState, useEffect } from 'react';
import { useHistoricalCapture } from '../../../context/HistoricalCaptureContext';
import DeleteConfirmation from '../../common/DeleteConfirmation';
import { formatDateLong } from '../../../utils/dateUtils';

const Step2_Consultation = () => {
    const {
        consultationForm, setConsultationForm,
        capturedData, setCapturedData,
        setLoading, setError, setCurrentStep, prevStep, loading
    } = useHistoricalCapture();

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [existingConsultations, setExistingConsultations] = useState([]);
    const [loadingExisting, setLoadingExisting] = useState(false);

    // Fetch existing consultations for the patient
    useEffect(() => {
        const fetchExisting = async () => {
            if (!capturedData.patient?.id) return;
            setLoadingExisting(true);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/consultations/patient/${capturedData.patient.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    let items = data.items || (Array.isArray(data) ? data : []);
                    // Sort by newest
                    items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                    setExistingConsultations(items);
                }
            } catch (err) {
                console.error("Failed to load existing consultations", err);
            } finally {
                setLoadingExisting(false);
            }
        };
        fetchExisting();
    }, [capturedData.patient]);

    const handleConChange = (e) => setConsultationForm({ ...consultationForm, [e.target.name]: e.target.value });

    const handleSelectExisting = (consultation) => {
        setCapturedData(prev => ({ ...prev, consultation }));
        setCurrentStep(3);
    };

    const confirmDelete = (consultation) => {
        setDeleteTarget(consultation);
    };

    const executeDelete = async () => {
        if (!deleteTarget) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/consultations/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setExistingConsultations(prev => prev.filter(c => c.id !== deleteTarget.id));
                setDeleteTarget(null); // Close modal
            } else {
                throw new Error("Error al eliminar consulta. Puede tener ventas asociadas.");
            }
        } catch (error) {
            console.error("Error deleting consultation", error);
            throw error;
        }
    };

    const handleSaveConsultation = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/consultations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    pacienteId: capturedData.patient.id,
                    fecha: consultationForm.fecha,
                    motivoConsulta: consultationForm.motivo,
                    estadoFinanciero: 'pendiente'
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Error al guardar consulta: ${errText}`);
            }
            const data = await response.json();

            setCapturedData(prev => ({ ...prev, consultation: data }));
            setCurrentStep(3);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="step-consultation fade-in">
            <h3>Paso 2: Datos de la Consulta</h3>

            {/* EXISTING CONSULTATIONS PANEL */}
            {existingConsultations.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                    <h4 className="flex items-center gap-2 mb-2 text-slate-700 font-semibold text-sm">
                        <span>📂</span> Consultas Existentes Detectadas
                    </h4>
                    <p className="text-sm text-muted mb-4">
                        Este paciente ya tiene consultas registradas. Si desea continuar una captura incompleta, seleccione una de la lista:
                    </p>
                    <div className="overflow-y-auto max-h-40 border border-slate-200 rounded-md bg-white">
                        {loadingExisting ? <div className="p-4 text-center text-sm text-muted">Cargando...</div> : (
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 sticky top-0">
                                    <tr className="text-left text-slate-600 font-semibold">
                                        <th className="p-2 border-b">Fecha</th>
                                        <th className="p-2 border-b">Motivo</th>
                                        <th className="p-2 border-b text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {existingConsultations.map(c => (
                                        <tr key={c.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                                            <td className="p-2 text-slate-700">{formatDateLong(c.fecha)}</td>
                                            <td className="p-2 text-slate-700">{c.motivoConsulta}</td>
                                            <td className="p-2 flex gap-2 justify-end">
                                                <button
                                                    className="btn btn-secondary text-xs py-1 px-2 h-auto"
                                                    onClick={() => handleSelectExisting(c)}
                                                >
                                                    Usar esta ➜
                                                </button>
                                                <button
                                                    className="btn btn-ghost text-danger text-xs py-1 px-2 h-auto"
                                                    onClick={() => confirmDelete(c)}
                                                    title="Eliminar consulta vacía/errónea"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 animate-fade-in">
                        <DeleteConfirmation
                            title="¿Eliminar Consulta?"
                            itemName={`Consulta del ${formatDateLong(deleteTarget.fecha)}`}
                            onConfirm={executeDelete}
                            onCancel={() => setDeleteTarget(null)}
                            warningText="Solo debe eliminar consultas que no tengan ventas asociadas o hayan sido creadas por error."
                            consequences={[
                                "Se eliminará permanentemente el registro de la consulta.",
                                "Se eliminarán las graduaciones asociadas a esta consulta."
                            ]}
                        />
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4 my-8 text-slate-400 font-medium text-xs tracking-widest uppercase">
                <span className="flex-1 h-px bg-slate-200"></span>
                <span>O registre una nueva</span>
                <span className="flex-1 h-px bg-slate-200"></span>
            </div>

            <div className="grid-cols-2 mb-6">
                <div className="form-group">
                    <label>Fecha de la Nota</label>
                    <input
                        type="date"
                        name="fecha"
                        className="form-input"
                        value={consultationForm.fecha}
                        onChange={handleConChange}
                    />
                </div>
                <div className="form-group">
                    <label>Motivo</label>
                    <input
                        type="text"
                        name="motivo"
                        className="form-input"
                        value={consultationForm.motivo}
                        onChange={handleConChange}
                        placeholder="Ej. Revisión general, Lentes rotos..."
                    />
                </div>
            </div>
            <div className="form-actions">
                <button className="btn btn-secondary" onClick={prevStep}>Atrás</button>
                <button className="btn btn-primary" onClick={handleSaveConsultation} disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Nueva y Continuar →'}
                </button>
            </div>
        </div>
    );
};

export default Step2_Consultation;
