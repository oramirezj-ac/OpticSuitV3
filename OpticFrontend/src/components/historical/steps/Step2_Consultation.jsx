import React, { useState, useEffect } from 'react';
import { useHistoricalCapture } from '../../../context/HistoricalCaptureContext';
import DeleteConfirmation from '../../common/DeleteConfirmation';

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
            // Optional: set some error state to show inside modal or alert?
            // DeleteConfirmation handles errors if we throw, but we want to close if successful?
            // Actually DeleteConfirmation usually takes onConfirm promise.
            // Let's re-throw so modal can show error?
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
        <div className="step-consultation">
            <h3>Paso 2: Datos de la Consulta</h3>

            {/* EXISTING CONSULTATIONS PANEL */}
            {existingConsultations.length > 0 && (
                <div className="existing-consultations-panel" style={{ marginBottom: '25px', padding: '15px', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '1em', color: '#475569' }}>📂 Consultas Existentes Detectadas</h4>
                    <p style={{ fontSize: '0.9em', color: '#64748b' }}>
                        Este paciente ya tiene consultas registradas. Si desea continuar una captura incompleta, seleccione una de la lista:
                    </p>
                    <div className="table-responsive" style={{ maxHeight: '150px', overflowY: 'auto', marginTop: '10px' }}>
                        {loadingExisting ? <div>Cargando...</div> : (
                            <table className="table-mini" style={{ width: '100%', fontSize: '0.9em', background: '#fff' }}>
                                <thead>
                                    <tr style={{ background: '#e2e8f0' }}>
                                        <th style={{ padding: '5px' }}>Fecha</th>
                                        <th style={{ padding: '5px' }}>Motivo</th>
                                        <th style={{ padding: '5px' }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {existingConsultations.map(c => (
                                        <tr key={c.id}>
                                            <td style={{ padding: '5px' }}>{new Date(c.fecha).toLocaleDateString()}</td>
                                            <td style={{ padding: '5px' }}>{c.motivoConsulta}</td>
                                            <td style={{ padding: '5px', display: 'flex', gap: '5px' }}>
                                                <button
                                                    className="btn-sm btn-outline-primary"
                                                    style={{ padding: '2px 8px', fontSize: '0.85em' }}
                                                    onClick={() => handleSelectExisting(c)}
                                                >
                                                    Usar esta ➜
                                                </button>
                                                <button
                                                    className="btn-sm btn-outline-danger"
                                                    style={{ padding: '2px 8px', fontSize: '0.85em', color: 'red', borderColor: 'red' }}
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
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', maxWidth: '500px', width: '90%' }}>
                        <DeleteConfirmation
                            title="¿Eliminar Consulta?"
                            itemName={`Consulta del ${new Date(deleteTarget.fecha).toLocaleDateString()}`}
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

            <div className="form-title-separator" style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#94a3b8' }}>
                <span style={{ flex: 1, height: '1px', background: '#cbd5e1' }}></span>
                <span style={{ padding: '0 10px', fontSize: '0.9em', fontWeight: 'bold' }}>O REGISTRE UNA NUEVA</span>
                <span style={{ flex: 1, height: '1px', background: '#cbd5e1' }}></span>
            </div>

            <div className="form-row">
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
                    />
                </div>
            </div>
            <div className="form-actions">
                <button className="btn-secondary" onClick={prevStep}>Atrás</button>
                <button className="btn-primary" onClick={handleSaveConsultation} disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Nueva y Continuar →'}
                </button>
            </div>
        </div>
    );
};

export default Step2_Consultation;
