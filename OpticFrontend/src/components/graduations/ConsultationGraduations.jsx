import React from 'react';
import SuccessOverlay from '../common/SuccessOverlay';
import { useConsultationGraduations } from './useConsultationGraduations';
import ConsultationGraduationsSummaryCard from './ConsultationGraduationsSummaryCard';
import ConsultationGraduationsList from './ConsultationGraduationsList';
import ConsultationGraduationsForm from './ConsultationGraduationsForm';
import './GraduationCreate.css';

const ConsultationGraduations = ({ onNavigate, params }) => {
    const { consultationId, patientId } = params || {};

    const { state, actions } = useConsultationGraduations(consultationId);

    const {
        consultation, graduations, loading, error,
        showForm, editingId, form, savingForm, formError,
        showSuccess, successMsg, deletingId, deleting
    } = state;

    const {
        openAddForm, openEditForm, cancelForm, handleGradChange, handleSave,
        handleDelete, setDeletingId, setForm
    } = actions;

    const goBack = () => {
        if (patientId) {
            onNavigate('patient-details', { patientId, initialTab: 'consultations_lenses' });
        } else {
            onNavigate('consultations');
        }
    };

    if (loading) return <div className="loading-container"><div className="loader"></div></div>;

    if (error && !consultation) return (
        <div className="graduation-create-container">
            <div className="alert alert-danger">{error}</div>
            <button className="btn-secondary" onClick={goBack}>← Regresar</button>
        </div>
    );

    const patient = consultation?.paciente;

    return (
        <div className="graduation-create-container animate-fade-in">
            <SuccessOverlay show={showSuccess} message={successMsg} />

            {/* ── PAGE HEADER ────────────────────────────────────────────────── */}
            <div className="graduation-header">
                <div>
                    <h2><span className="icon">👓</span> Graduaciones de Consulta</h2>
                    <div className="patient-context" style={{ marginTop: '4px' }}>
                        Paciente:&nbsp;
                        <strong>{patient ? `${patient.nombre} ${patient.apellidoPaterno || ''}` : '—'}</strong>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" onClick={goBack}>← Regresar al Expediente</button>
                    {graduations.length > 0 && (
                        <button
                            className="btn-primary"
                            style={{ background: '#10b981' }}
                            onClick={() => onNavigate('sales-create', { patientId, consultationId, defaultDate: consultation?.fecha ? consultation.fecha.split('T')[0] : '' })}
                        >
                            💰 Generar Venta
                        </button>
                    )}
                </div>
            </div>

            {/* ── CONSULTATION SUMMARY CARD ──────────────────────────────────── */}
            <ConsultationGraduationsSummaryCard 
                consultation={consultation} 
                graduationsCount={graduations.length} 
            />

            {/* ── GRADUATIONS LIST ───────────────────────────────────────────── */}
            <ConsultationGraduationsList
                graduations={graduations}
                showForm={showForm}
                openAddForm={openAddForm}
                openEditForm={openEditForm}
                deletingId={deletingId}
                setDeletingId={setDeletingId}
                handleDelete={handleDelete}
                deleting={deleting}
                error={error}
            />

            {/* ── ADD / EDIT FORM ────────────────────────────────────────────── */}
            {showForm && (
                <ConsultationGraduationsForm
                    form={form}
                    handleGradChange={handleGradChange}
                    handleSave={handleSave}
                    cancelForm={cancelForm}
                    savingForm={savingForm}
                    editingId={editingId}
                    formError={formError}
                    setForm={setForm}
                />
            )}
        </div>
    );
};

export default ConsultationGraduations;
