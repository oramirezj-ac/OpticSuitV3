import React from 'react';
import ReactDOM from 'react-dom';
import { useConsultations } from '../../../context/consultations/ConsultationsContext';
import WizardStep1_Patient from './WizardStep1_Patient';
import WizardStep2_Consultation from './WizardStep2_Consultation';
import WizardStep3_Graduation from './WizardStep3_Graduation';
import WizardStep4_Sale from './WizardStep4_Sale';

const CaptureWizardModal = ({ onNavigate }) => {
    const {
        wizardType,
        currentStep,
        closeWizard,
        successMessage,
        capturedData
    } = useConsultations();

    const renderStepContent = () => {
        if (successMessage) {
            return (
                <div className="alert alert-success mt-4 p-8 text-center animate-fade-in">
                    <h3 className="text-2xl mb-4">✅ {successMessage}</h3>
                    <p className="text-slate-600 mb-6">La consulta se ha registrado correctamente en el sistema.</p>
                    <div className="flex justify-center gap-4">
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                closeWizard();
                                onNavigate('patient-details', { patientId: capturedData.patient?.id });
                            }}
                        >
                            📂 Ver Expediente
                        </button>
                        <button className="btn-primary" onClick={closeWizard}>
                            Cerrar
                        </button>
                    </div>
                </div>
            );
        }

        switch (currentStep) {
            case 0:
                return <WizardStep1_Patient />;
            case 1:
                return <WizardStep2_Consultation />;
            case 2:
                // If it's medical, Step 3 is Sale. If it's glasses, Step 3 is Graduation
                return wizardType === 'medical' ? <WizardStep4_Sale /> : <WizardStep3_Graduation />;
            case 3:
                // Only glasses wizard has a Step 4
                return wizardType === 'glasses' ? <WizardStep4_Sale /> : null;
            default:
                return null;
        }
    };

    const getWizardTitle = () => {
        return wizardType === 'medical' ? 'Nueva Consulta Médica' : 'Nueva Consulta (Lentes)';
    };

    const getStepProgress = () => {
        const totalSteps = wizardType === 'medical' ? 3 : 4;
        return `${currentStep + 1} de ${totalSteps}`;
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay" style={{ zIndex: 100 }}>
            {/* Ampliamos el modal para dar espacio holgado a la captura de graduación y venta */}
            <div className="modal-card" style={{ maxWidth: '1100px', width: '95%', minHeight: '85vh', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <div>
                        <h3 className="flex items-center gap-2">
                            <span>{wizardType === 'medical' ? '🩺' : '👓'}</span>
                            {getWizardTitle()}
                        </h3>
                        {!successMessage && (
                            <span className="text-xs text-slate-500 font-medium">Paso {getStepProgress()}</span>
                        )}
                    </div>
                    {/* Only allow closing if not in the middle of a critical operation like saving. For simplicity, we allow it anytime, but they lose progress. */}
                    <button className="btn-close" onClick={closeWizard} title="Cancelar y Cerrar">&times;</button>
                </div>

                <div className="modal-body" style={{ overflowY: 'auto', padding: '24px' }}>
                    {renderStepContent()}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CaptureWizardModal;
