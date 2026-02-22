import React, { useState } from 'react';
import { useHistoricalCapture } from '../../../context/HistoricalCaptureContext';

const Step2_Consultation = () => {
    const {
        consultationForm, setConsultationForm,
        capturedData, setCapturedData,
        setLoading, setError, setCurrentStep, prevStep, loading
    } = useHistoricalCapture();

    const handleConChange = (e) => setConsultationForm({ ...consultationForm, [e.target.name]: e.target.value });

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
                    tipoConsulta: 'consulta_lentes',
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
