import React, { useState, useEffect } from 'react';
import './PatientDetails.css';

const PatientDetails = ({ patientId, onBack, onNavigate }) => {
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'consultations', 'sales'

    useEffect(() => {
        const fetchPatientDetails = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/patients/${patientId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Error al cargar expediente');

                const data = await response.json();
                setPatient(data);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (patientId) fetchPatientDetails();
    }, [patientId]);

    if (loading) return <div className="loading-container"><div className="loader"></div></div>;
    if (error) return <div className="alert alert-danger">Error: {error} <button onClick={onBack}>Regresar</button></div>;
    if (!patient) return <div>No se encontró el paciente.</div>;

    const isPresbyopicRisk = patient.edad && patient.edad >= 40;

    return (
        <div className="patient-details-container">
            {/* Header / Expediente Info */}
            <div className="patient-header-card">
                <div className="patient-header-top">
                    <button className="btn-back" onClick={onBack}>← Volver a Lista</button>
                    <div className="patient-identity">
                        <h2>{patient.nombre} {patient.apellidoPaterno} {patient.apellidoMaterno}</h2>
                        <div className="patient-badges">
                            <span className="badge-age">{patient.edad ? `${patient.edad} Años` : 'Edad N/D'}</span>
                            {isPresbyopicRisk && <span className="badge-warning">⚠️ Revisar Adición</span>}
                            <span className={`badge-status ${patient.estaActivo ? 'active' : 'inactive'}`}>
                                {patient.estaActivo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="patient-quick-info">
                    <div className="info-item">
                        <span className="label">Teléfono:</span>
                        <span className="value">{patient.telefono || '-'}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Fecha Registro:</span>
                        <span className="value">
                            {patient.fechaRegistro
                                ? new Date(patient.fechaRegistro).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                : '-'}
                        </span>
                    </div>
                </div>
            </div>

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
                    Consultas (0)
                </button>
                <button
                    className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sales')}
                >
                    Ventas (0)
                </button>
            </div>

            {/* Tab Content */}
            <div className="details-content">
                {activeTab === 'summary' && (
                    <div className="summary-view">
                        <div className="action-cards">
                            <div className="action-card" onClick={() => console.log('Nueva Consulta')}>
                                <div className="icon">👁️</div>
                                <h3>Nueva Consulta</h3>
                                <p>Iniciar examen de la vista</p>
                            </div>
                            <div className="action-card" onClick={() => console.log('Nueva Venta')}>
                                <div className="icon">👓</div>
                                <h3>Nueva Venta</h3>
                                <p>Registrar venta de armazón/lentes</p>
                            </div>
                        </div>

                        <div className="notes-section">
                            <h4>Notas / Antecedentes</h4>
                            <div className="notes-box">
                                {patient.notas || 'Sin notas registradas.'}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'consultations' && (
                    <div className="empty-tab">
                        <p>No hay consultas registradas.</p>
                        <button className="btn-primary">+ Nueva Consulta</button>
                    </div>
                )}

                {activeTab === 'sales' && (
                    <div className="empty-tab">
                        <p>No hay ventas registradas.</p>
                        <button className="btn-primary">+ Nueva Venta</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientDetails;
