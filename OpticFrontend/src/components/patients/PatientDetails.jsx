import React, { useState } from 'react';
import { usePatientData } from '../../hooks/usePatientData';
import { formatDateForInput } from '../../utils/dateUtils';
import SaleDetailModal from './details/SaleDetailModal';
import PatientHeader from './details/PatientHeader';
import PatientSummary from './details/PatientSummary';
import ConsultationHistory from './details/ConsultationHistory';
import SalesHistory from './details/SalesHistory';
import MedicalCheckoutModal from './details/MedicalCheckoutModal';
import ConsultationCreateModal from './details/ConsultationCreateModal';
import './PatientDetails.css';

const PatientDetails = ({ patientId, onBack, onNavigate, initialTab }) => {
    // Custom Hook para datos y lógica de pestañas
    const {
        patient,
        loading,
        error,
        activeTab,
        setActiveTab,
        consultations,
        sales,
        loadingTab,
        refreshData
    } = usePatientData(patientId, initialTab || 'summary');

    // Estado local para UI (Modal)
    const [selectedSale, setSelectedSale] = useState(null);
    const [checkoutConsultation, setCheckoutConsultation] = useState(null);
    const [consultationCreateType, setConsultationCreateType] = useState(null); // null = closed, 'consulta_lentes' or 'consulta_medica'

    const handleCheckoutSuccess = () => {
        setCheckoutConsultation(null);
        setActiveTab('sales');
        refreshData();
    };

    const handleConsultationSuccess = () => {
        setConsultationCreateType(null);
        refreshData();
    };

    const handleNavigateGraduations = (consultationId) => {
        setConsultationCreateType(null);
        onNavigate('consultation-graduations', {
            consultationId,
            patientId
        });
    };

    const patientFullName = patient ? `${patient.nombre} ${patient.apellidoPaterno || ''} ${patient.apellidoMaterno || ''}`.trim() : '';

    const handleSaleUpdated = (updatedSale) => {
        setSelectedSale(updatedSale);
        refreshData();
    };

    const handleDeleteConsultation = async (id) => {
        if (onNavigate) {
            onNavigate('consultation-delete', { consultationId: id, patientId: patientId });
        }
    };

    const handleDeleteSale = async (id) => {
        if (onNavigate) {
            onNavigate('sale-delete', { saleId: id, patientId: patientId });
        }
    };

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
                    className={`tab-btn ${activeTab === 'consultations_lenses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('consultations_lenses')}
                >
                    Consultas (Lentes)
                </button>
                <button
                    className={`tab-btn ${activeTab === 'consultations_medical' ? 'active' : ''}`}
                    onClick={() => setActiveTab('consultations_medical')}
                >
                    Consultas Médicas
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

                {activeTab === 'consultations_lenses' && (
                    <ConsultationHistory
                        type="lenses"
                        patientId={patientId}
                        consultations={consultations}
                        loading={loadingTab}
                        onNavigate={onNavigate}
                        onDelete={handleDeleteConsultation}
                        onCreateConsultation={() => setConsultationCreateType('consulta_lentes')}
                    />
                )}

                {activeTab === 'consultations_medical' && (
                    <ConsultationHistory
                        type="medical"
                        patientId={patientId}
                        consultations={consultations}
                        loading={loadingTab}
                        onNavigate={onNavigate}
                        onCheckout={setCheckoutConsultation}
                        onDelete={handleDeleteConsultation}
                        onCreateConsultation={() => setConsultationCreateType('consulta_medica')}
                    />
                )}

                {activeTab === 'sales' && (
                    <SalesHistory
                        sales={sales}
                        patientId={patientId}
                        loading={loadingTab}
                        onNavigate={onNavigate}
                        onSelectSale={setSelectedSale}
                        onDeleteSale={handleDeleteSale}
                        defaultDate={patient ? formatDateForInput(patient.fechaRegistro) : ''}
                    />
                )}
            </div>

            {/* SALE DETAILS MODAL */}
            <SaleDetailModal
                sale={selectedSale}
                patientId={patientId}
                onClose={() => setSelectedSale(null)}
                onSaleUpdated={handleSaleUpdated}
                onNavigate={onNavigate}
            />

            {/* MEDICAL CHECKOUT MODAL */}
            {checkoutConsultation && (
                <MedicalCheckoutModal
                    consultation={checkoutConsultation}
                    patientId={patientId}
                    onClose={() => setCheckoutConsultation(null)}
                    onSuccess={handleCheckoutSuccess}
                />
            )}

            {/* CONSULTATION CREATE MODAL */}
            {consultationCreateType && (
                <ConsultationCreateModal
                    patientId={patientId}
                    patientName={patientFullName}
                    tipoConsulta={consultationCreateType}
                    defaultDate={patient ? formatDateForInput(patient.fechaRegistro) : ''}
                    onClose={() => setConsultationCreateType(null)}
                    onSuccess={handleConsultationSuccess}
                    onNavigateGraduations={handleNavigateGraduations}
                />
            )}
        </div>
    );
};

export default PatientDetails;
