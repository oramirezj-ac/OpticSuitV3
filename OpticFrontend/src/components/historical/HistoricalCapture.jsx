import React from 'react';
import { HistoricalCaptureProvider, useHistoricalCapture } from '../../context/HistoricalCaptureContext';
import Step1_Patient from './steps/Step1_Patient';
import Step2_Consultation from './steps/Step2_Consultation';
import Step3_Graduation from './steps/Step3_Graduation';
import Step4_Sale from './steps/Step4_Sale';
import './HistoricalCapture.css';

const HistoricalCaptureContent = () => {
    const { currentStep, successMessage, error, resetFlow, capturedData, onNavigate } = useHistoricalCapture();

    const renderStepper = () => (
        <div className="details-tabs" style={{ marginBottom: '30px', borderBottom: '2px solid #e2e8f0' }}>
            <button
                className={`tab-btn ${currentStep === 1 ? 'active' : ''}`}
                onClick={() => { if (currentStep > 1) { /* Allow going back logic if needed, or just visual */ } }}
                style={{ cursor: currentStep > 1 ? 'pointer' : 'default' }}
            >
                1. Paciente
            </button>
            <button
                className={`tab-btn ${currentStep === 2 ? 'active' : ''}`}
                disabled={currentStep < 2}
                style={{ cursor: currentStep >= 2 ? 'pointer' : 'not-allowed', color: currentStep < 2 ? '#cbd5e1' : undefined }}
            >
                2. Consulta
            </button>
            <button
                className={`tab-btn ${currentStep === 3 ? 'active' : ''}`}
                disabled={currentStep < 3}
                style={{ cursor: currentStep >= 3 ? 'pointer' : 'not-allowed', color: currentStep < 3 ? '#cbd5e1' : undefined }}
            >
                3. Graduación
            </button>
            <button
                className={`tab-btn ${currentStep === 4 ? 'active' : ''}`}
                disabled={currentStep < 4}
                style={{ cursor: currentStep >= 4 ? 'pointer' : 'not-allowed', color: currentStep < 4 ? '#cbd5e1' : undefined }}
            >
                4. Venta
            </button>
        </div>
    );

    return (
        <div className="historical-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2><span className="icon">📜</span> Captura Histórica de Notas</h2>
                {successMessage && <button className="btn-primary" onClick={resetFlow}>Nueva Captura +</button>}
            </div>

            {!successMessage && renderStepper()}

            {error && <div className="alert alert-danger">{error}</div>}
            {successMessage && (
                <div className="alert alert-success" style={{ padding: '40px', textAlign: 'center' }}>
                    <h3>✅ {successMessage}</h3>
                    <p>La nota se ha registrado correctamente en el sistema.</p>
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            className="btn-secondary"
                            onClick={() => onNavigate('patient-details', { patientId: capturedData.patient.id })}
                        >
                            📂 Ver Expediente Completo
                        </button>
                        <button className="btn-primary" onClick={resetFlow}>
                            Nueva Captura +
                        </button>
                    </div>
                </div>
            )}

            {!successMessage && (
                <div className="step-content">
                    {currentStep === 1 && <Step1_Patient />}
                    {currentStep === 2 && <Step2_Consultation />}
                    {currentStep === 3 && <Step3_Graduation />}
                    {currentStep === 4 && <Step4_Sale />}
                </div>
            )}
        </div>
    );
};

const HistoricalCapture = ({ onNavigate }) => {
    return (
        <HistoricalCaptureProvider onNavigate={onNavigate}>
            <HistoricalCaptureContent />
        </HistoricalCaptureProvider>
    );
};

export default HistoricalCapture;
