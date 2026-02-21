import React, { createContext, useContext, useState } from 'react';

const ConsultationsContext = createContext();

export const useConsultations = () => {
    return useContext(ConsultationsContext);
};

export const ConsultationsProvider = ({ children }) => {
    // 0: Initial (Select Patient), 1: Consultation Details, 2: Medical Details (Diagnosis), 3: Graduation, 4: Sale
    const [currentStep, setCurrentStep] = useState(0);
    const [wizardType, setWizardType] = useState(null); // 'glasses', 'medical', null
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    // Captured Data
    const [capturedData, setCapturedData] = useState({
        patient: null,
        consultation: null,
        graduation: null,
        sale: null
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const openWizard = (type) => { // 'glasses' or 'medical'
        setWizardType(type);
        setIsWizardOpen(true);
        setCurrentStep(0);
        setCapturedData({
            patient: null,
            consultation: null,
            graduation: null,
            sale: null
        });
        setError(null);
        setSuccessMessage(null);
    };

    const closeWizard = () => {
        setIsWizardOpen(false);
        setWizardType(null);
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => (prev > 0 ? prev - 1 : 0));

    const value = {
        isWizardOpen,
        wizardType,
        currentStep,
        setCurrentStep,
        openWizard,
        closeWizard,
        nextStep,
        prevStep,
        capturedData,
        setCapturedData,
        loading,
        setLoading,
        error,
        setError,
        successMessage,
        setSuccessMessage
    };

    return (
        <ConsultationsContext.Provider value={value}>
            {children}
        </ConsultationsContext.Provider>
    );
};
