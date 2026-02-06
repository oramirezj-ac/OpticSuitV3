import React, { createContext, useState, useContext } from 'react';

const HistoricalCaptureContext = createContext();

export const useHistoricalCapture = () => {
    return useContext(HistoricalCaptureContext);
};

export const HistoricalCaptureProvider = ({ children, onNavigate }) => {
    // Stepper State
    const [currentStep, setCurrentStep] = useState(1);

    // Data Accumulator
    const [capturedData, setCapturedData] = useState({
        patient: null,       // Stores full patient object after save/select
        consultation: null,  // Stores consultation basic info
        graduation: null,    // Stores refraction data
        sale: null           // Stores sale data
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // ================= FORMS STATE =================
    // Step 2: Consultation
    const [consultationForm, setConsultationForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        motivo: 'Nota Histórica'
    });

    // Step 3: Graduation
    const [graduationForm, setGraduationForm] = useState({
        od_esfera: '', od_cilindro: '', od_eje: '', od_adicion: '',
        oi_esfera: '', oi_cilindro: '', oi_eje: '', oi_adicion: '',
        dp: ''
    });

    // Step 4: Sale
    const [saleForm, setSaleForm] = useState({
        folio_fisico: '',
        total_venta: '',
        anticipo_monto: '',
        metodo_pago: 'Efectivo',
        observaciones: '',
        usuarioId: '' // Vendedor seleccionado
    });

    // Payment State
    const [paymentList, setPaymentList] = useState([]);

    // Actions / Handlers

    const resetFlow = () => {
        // Reset all states
        setCurrentStep(1);
        setCapturedData({ patient: null, consultation: null, graduation: null, sale: null });
        setLoading(false);
        setError(null);
        setSuccessMessage(null);
        setConsultationForm({ fecha: new Date().toISOString().split('T')[0], motivo: 'Nota Histórica' });
        setGraduationForm({
            od_esfera: '', od_cilindro: '', od_eje: '', od_adicion: '',
            oi_esfera: '', oi_cilindro: '', oi_eje: '', oi_adicion: '',
            dp: ''
        });
        setSaleForm({
            folio_fisico: '',
            total_venta: '',
            anticipo_monto: '',
            metodo_pago: 'Efectivo',
            observaciones: ''
        });
        setPaymentList([]);
    };

    const nextStep = () => setCurrentStep(p => p + 1);
    const prevStep = () => setCurrentStep(p => Math.max(1, p - 1));

    const value = {
        currentStep, setCurrentStep,
        capturedData, setCapturedData,
        loading, setLoading,
        error, setError,
        successMessage, setSuccessMessage,
        consultationForm, setConsultationForm,
        graduationForm, setGraduationForm,
        saleForm, setSaleForm,
        paymentList, setPaymentList,
        resetFlow,
        nextStep,
        prevStep,
        onNavigate
    };

    return (
        <HistoricalCaptureContext.Provider value={value}>
            {children}
        </HistoricalCaptureContext.Provider>
    );
};
