import React from 'react';
import { useConsultationCreate } from './useConsultationCreate';
import ConsultationCreatePatientSelector from './ConsultationCreatePatientSelector';
import ConsultationCreateForm from './ConsultationCreateForm';
import ConsultationCreateSummary from './ConsultationCreateSummary';
import SuccessOverlay from '../common/SuccessOverlay';
import './ConsultationCreate.css';

const ConsultationCreate = ({ onNavigate, params }) => {
    const { state, actions } = useConsultationCreate(params, onNavigate);

    const {
        selectionTab, recentPatients, selectedPatient, searchQuery, searchResults,
        tipoConsulta, form, selectedProducts, pharmacyCatalog,
        loading, showSuccess, error, metodoPago
    } = state;

    const {
        setSelectionTab, setSelectedPatient, setSearchQuery, setTipoConsulta,
        setMetodoPago, handleSearch, handleFormChange, toggleProduct,
        calculateTotal, handleSave
    } = actions;

    if (selectedPatient) {
        return (
            <div className="consultation-create-container animate-fade-in">
                <SuccessOverlay show={showSuccess} message="Consulta Registrada con Éxito" />
                
                <div className="module-header">
                    <h2><span className="icon">🩺</span> Detalle de la Consulta</h2>
                    <button className="btn-secondary" onClick={() => setSelectedPatient(null)}>Cambiar Paciente</button>
                </div>

                <div className="card">
                    <div className="patient-banner mb-6">
                        <span className="label">Paciente:</span>
                        <span className="name">{selectedPatient.nombre} {selectedPatient.apellidoPaterno} {selectedPatient.apellidoMaterno}</span>
                    </div>

                    <form onSubmit={handleSave}>
                        <ConsultationCreateForm 
                            form={form}
                            handleFormChange={handleFormChange}
                            tipoConsulta={tipoConsulta}
                            setTipoConsulta={setTipoConsulta}
                            params={params}
                            pharmacyCatalog={pharmacyCatalog}
                            selectedProducts={selectedProducts}
                            toggleProduct={toggleProduct}
                        />

                        <ConsultationCreateSummary 
                            calculateTotal={calculateTotal}
                            metodoPago={metodoPago}
                            setMetodoPago={setMetodoPago}
                            error={error}
                            loading={loading}
                            params={params}
                            onNavigate={onNavigate}
                        />
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="consultation-create-container animate-fade-in">
            <div className="module-header">
                <h2><span className="icon">🩺</span> Nueva Consulta</h2>
                <button className="btn-secondary" onClick={() => onNavigate('consultations')}>Volver al Listado</button>
            </div>

            <ConsultationCreatePatientSelector 
                selectionTab={selectionTab}
                setSelectionTab={setSelectionTab}
                recentPatients={recentPatients}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearch={handleSearch}
                searchResults={searchResults}
                setSelectedPatient={setSelectedPatient}
                loading={loading}
            />
        </div>
    );
};

export default ConsultationCreate;
