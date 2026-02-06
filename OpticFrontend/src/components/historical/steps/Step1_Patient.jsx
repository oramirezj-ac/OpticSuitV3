import React, { useState, useEffect } from 'react';
import HistoricalPatientForm from '../HistoricalPatientForm';
import { useHistoricalCapture } from '../../../context/HistoricalCaptureContext';
import { formatDateLong } from '../../../utils/dateUtils';

const Step1_Patient = () => {
    const { setCapturedData, setConsultationForm, setCurrentStep } = useHistoricalCapture();
    const [recentPatients, setRecentPatients] = useState([]);

    // Load recent patients on mount
    useEffect(() => {
        const fetchRecents = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch('/api/patients?page=1&pageSize=5', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.items) {
                        setRecentPatients(data.items);
                    }
                }
            } catch (err) {
                console.error("Error fetching recent patients:", err);
            }
        };
        fetchRecents();
    }, []);

    const handlePatientSuccess = (patientData, preferredDate = null) => {
        setCapturedData(prev => ({ ...prev, patient: patientData }));
        // Si el paciente tiene fechaRegistro historica (o se seleccionó una en el form), la sugerimos
        const dateToUse = preferredDate || patientData.fechaRegistro;
        if (dateToUse) {
            setConsultationForm(prev => ({ ...prev, fecha: dateToUse.split('T')[0] }));
        }
        setCurrentStep(2);
    };

    return (
        <div className="step-patient">
            <h3>Paso 1: Identificar Paciente</h3>
            <div className="form-container" style={{ background: '#fff', padding: '0' }}>
                <HistoricalPatientForm onPatientSelected={handlePatientSuccess} />
            </div>

            {/* RECENT PATIENTS SHORTCUT */}
            <div className="recent-patients-panel" style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <h4>🕒 Pacientes Recientes</h4>
                <p style={{ color: '#64748b', fontSize: '0.9em' }}>Seleccione uno de los últimos pacientes registrados para agilizar la captura:</p>

                <div className="table-responsive" style={{ marginTop: '10px' }}>
                    <table className="table table-hover" style={{ fontSize: '0.9em' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th>Nombre Completo</th>
                                <th>Fecha Registro</th>
                                <th>Teléfono</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPatients.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Cargando recientes...</td></tr>
                            ) : (
                                recentPatients.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            <strong>{p.nombre} {p.apellidoPaterno} {p.apellidoMaterno}</strong>
                                        </td>
                                        <td>{formatDateLong(p.fechaRegistro)}</td>
                                        <td>{p.telefono || '-'}</td>
                                        <td>
                                            <button
                                                className="btn-sm btn-outline-primary"
                                                onClick={() => handlePatientSuccess(p)}
                                            >
                                                Seleccionar →
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Step1_Patient;
