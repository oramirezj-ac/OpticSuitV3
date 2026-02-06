import React, { useState } from 'react';
import { usePatientData } from '../../hooks/usePatientData';
import SaleDetailModal from './details/SaleDetailModal';
import PatientHeader from './details/PatientHeader';
import PatientSummary from './details/PatientSummary';
import ConsultationHistory from './details/ConsultationHistory';
import SalesHistory from './details/SalesHistory';
import './PatientDetails.css';

const PatientDetails = ({ patientId, onBack, onNavigate }) => {
    // Custom Hook para datos y lógica de pestañas
    const {
        patient,
        loading,
        error,
        activeTab,
        setActiveTab,
        consultations,
        sales,
        loadingTab
    } = usePatientData(patientId);

    // Estado local para UI (Modal)
    const [selectedSale, setSelectedSale] = useState(null);

    if (loading) return <div className="loading-container"><div className="loader"></div></div>;
    if (error) return <div className="alert alert-danger">Error: {error} <button onClick={onBack}>Regresar</button></div>;
    if (!patient) return <div>No se encontró el paciente.</div>;

    return (
        <div className="patient-details-container">
            {/* Header / Expediente Info */}
            <PatientHeader patient={patient} onBack={onBack} />

            {/* Tabs Navigation */}
            <div className="details-tabs">
                <button
                    className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    Resumen
                </button>
                <button
                    className={`tab-btn ${activeTab === 'consultations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('consultations')}
                >
                    Consultas
                </button>
                <button
                    className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sales')}
                >
                    Ventas
                </button>
            </div>

            {/* Tab Content */}
            <div className="details-content">
                {activeTab === 'summary' && (
                    <PatientSummary patient={patient} />
                )}

                {activeTab === 'consultations' && (
                    <ConsultationHistory
                        consultations={consultations}
                        loading={loadingTab}
                        onNavigate={onNavigate}
                    />
                )}

                {activeTab === 'sales' && (
                    <SalesHistory
                        sales={sales}
                        loading={loadingTab}
                        onNavigate={onNavigate}
                        onSelectSale={setSelectedSale}
                    />
                )}
            </div>

            {/* SALE DETAILS MODAL */}
            <SaleDetailModal
                sale={selectedSale}
                onClose={() => setSelectedSale(null)}
            />
        </div>
    );
};

export default PatientDetails;
