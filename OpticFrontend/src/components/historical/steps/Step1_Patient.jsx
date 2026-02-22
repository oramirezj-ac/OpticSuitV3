import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import HistoricalPatientForm from '../HistoricalPatientForm';
import { useHistoricalCapture } from '../../../context/HistoricalCaptureContext';
import { formatPhoneNumber } from '../../../utils/formatUtils';
import { apiClient } from '../../../services/apiClient';

const Step1_Patient = () => {
    const { setCapturedData, setConsultationForm, setCurrentStep } = useHistoricalCapture();

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [showNewPatientModal, setShowNewPatientModal] = useState(false);

    useEffect(() => {
        const fetchPatients = async () => {
            if (searchTerm.length < 2) {
                setSearchResults([]);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.get(`/api/patients?search=${encodeURIComponent(searchTerm)}&page=1&pageSize=10`);
                setSearchResults(response.items || []);
            } catch (err) {
                console.error("Failed to search patients:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const timerId = setTimeout(() => {
            fetchPatients();
        }, 500);

        return () => clearTimeout(timerId);
    }, [searchTerm]);

    const handleSelectPatient = (patient) => {
        setCapturedData(prev => ({ ...prev, patient }));
        setCurrentStep(2);
    };

    const handlePatientSuccess = (patientData, preferredDate = null) => {
        setCapturedData(prev => ({ ...prev, patient: patientData }));
        const dateToUse = preferredDate || patientData.fechaRegistro;
        if (dateToUse) {
            setConsultationForm(prev => ({ ...prev, fecha: dateToUse.split('T')[0] }));
        }
        setShowNewPatientModal(false);
        setCurrentStep(2);
    };

    return (
        <div className="step-patient fade-in">
            <div className="mb-6">
                <p className="text-sm text-slate-500">Busque un paciente existente o registre uno nuevo con fecha retroactiva para comenzar la captura histórica.</p>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                    <input
                        type="text"
                        className="form-input w-full p-3 text-lg font-medium"
                        placeholder="🔍 Buscar por nombre, teléfono o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>
                <button
                    className="btn-primary flex items-center gap-2"
                    onClick={() => setShowNewPatientModal(true)}
                >
                    <span className="text-xl">+</span> Nuevo Paciente
                </button>
            </div>

            {error && <div className="alert alert-danger mb-4">{error}</div>}

            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden min-h-[300px]">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Buscando paciente...</div>
                ) : searchResults.length > 0 ? (
                    <table className="w-full text-left modern-table">
                        <thead className="bg-white border-b border-slate-200">
                            <tr>
                                <th className="p-3 font-semibold text-slate-600">Nombre</th>
                                <th className="p-3 font-semibold text-slate-600">Teléfono</th>
                                <th className="p-3 font-semibold text-slate-600">Registro</th>
                                <th className="p-3 font-semibold text-slate-600 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {searchResults.map(p => (
                                <tr key={p.id} className="hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-0">
                                    <td className="p-3 font-medium text-slate-700">
                                        {p.nombre} {p.apellidoPaterno} {p.apellidoMaterno}
                                    </td>
                                    <td className="p-3 text-slate-600">{formatPhoneNumber(p.telefono) || '-'}</td>
                                    <td className="p-3 text-slate-600">{p.fechaRegistro ? p.fechaRegistro.split('T')[0] : '-'}</td>
                                    <td className="p-3 text-right">
                                        <button
                                            className="btn-secondary text-sm py-1 px-3"
                                            onClick={() => handleSelectPatient(p)}
                                        >
                                            Seleccionar ➜
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : searchTerm.length >= 2 ? (
                    <div className="p-8 text-center text-slate-500 italic">No se encontraron pacientes que coincidan con la búsqueda.</div>
                ) : (
                    <div className="p-12 text-center text-slate-400">
                        <span className="text-4xl mb-3 block">🧑‍⚕️</span>
                        Escriba al menos 2 caracteres para buscar
                    </div>
                )}
            </div>

            {showNewPatientModal && ReactDOM.createPortal(
                <div className="modal-overlay" style={{ zIndex: 110 }}>
                    <div className="modal-card" style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', minHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <h3>Nuevo Paciente (Histórico)</h3>
                            <button className="btn-close" onClick={() => setShowNewPatientModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body" style={{ overflowY: 'auto', padding: '24px' }}>
                            <HistoricalPatientForm onPatientSelected={handlePatientSuccess} />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Step1_Patient;
