import React from 'react';
import ReactDOM from 'react-dom';
import { useHistoricalCapture } from '../../../context/HistoricalCaptureContext';
import Step1_Patient from '../steps/Step1_Patient';
import Step2_Consultation from '../steps/Step2_Consultation';
import Step3_Graduation from '../steps/Step3_Graduation';
import Step4_Sale from '../steps/Step4_Sale';

const HistoricalWizardModal = ({ onNavigate, onClose }) => {
    const {
        currentStep,
        successMessage,
        resetFlow,
        capturedData
    } = useHistoricalCapture();

    const renderStepContent = () => {
        if (successMessage) {
            return (
                <div className="alert alert-success mt-4 p-8 text-center animate-fade-in">
                    <h3 className="text-2xl mb-4">✅ {successMessage}</h3>
                    <p className="text-slate-600 mb-6">La nota histórica se ha registrado correctamente en el sistema.</p>
                    <div className="flex justify-center gap-4">
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                onClose();
                                onNavigate('patient-details', { patientId: capturedData.patient?.id });
                            }}
                        >
                            📂 Ver Expediente
                        </button>
                        <button className="btn-primary" onClick={() => {
                            resetFlow();
                            onClose();
                        }}>
                            Cerrar
                        </button>
                    </div>
                </div>
            );
        }

        switch (currentStep) {
            case 1:
                return <Step1_Patient />;
            case 2:
                return <Step2_Consultation />;
            case 3:
                return <Step3_Graduation />;
            case 4:
                return <Step4_Sale />;
            default:
                return null;
        }
    };

    const getStepProgress = () => {
        return `${currentStep} de 4`;
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay" style={{ zIndex: 100 }}>
            {/* Ampliamos el modal para dar espacio holgado a la captura de graduación y venta */}
            <div className="modal-card" style={{ maxWidth: '1100px', width: '95%', minHeight: '85vh', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <div>
                        <h3 className="flex items-center gap-2">
                            <span>📜</span>
                            Captura Histórica de Notas
                        </h3>
                        {!successMessage && (
                            <span className="text-xs text-slate-500 font-medium">Paso {getStepProgress()}</span>
                        )}
                    </div>
                    <button className="btn-close" onClick={() => {
                        resetFlow();
                        onClose();
                    }} title="Cancelar y Cerrar">&times;</button>
                </div>

                {/* Adjusting inner steps styling to not have huge margins since they are now in a modal */}
                <div className="modal-body" style={{ overflowY: 'auto', padding: '24px' }}>
                    {renderStepContent()}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default HistoricalWizardModal;
