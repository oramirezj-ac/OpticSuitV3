import React, { useState, useEffect } from 'react';
import { useConsultations } from '../../../context/consultations/ConsultationsContext';
import { apiClient } from '../../../services/apiClient';
import PatientForm from '../../patients/PatientForm'; // Reusing the modal-based form
import { formatPhoneNumber } from '../../../utils/formatUtils';

const WizardStep1_Patient = () => {
    const { setCapturedData, nextStep, wizardType } = useConsultations();

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Modal for creating a new patient inline
    const [showNewPatientModal, setShowNewPatientModal] = useState(false);

    // Debounced search effect
    useEffect(() => {
        const fetchPatients = async () => {
            if (searchTerm.length < 2) {
                setSearchResults([]);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                // Fetch using our standard search endpoint logic
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
        }, 500); // 500ms debounce

        return () => clearTimeout(timerId);
    }, [searchTerm]);

    const handleSelectPatient = (patient) => {
        setCapturedData(prev => ({ ...prev, patient }));
        nextStep(); // Move to Step 2 (Consultation)
    };

    const handleNewPatientSuccess = async () => {
        setShowNewPatientModal(false);
        // We need to automatically select the newly created patient.
        // The easiest way is to search by the same name or wait for the user.
        // For a smoother flow, since PatientForm doesn't return the ID, we'll prompt the user to search again or we can re-fetch latest.
        // Given PatientForm currently doesn't easily return the newly created object, we will refetch the list ordered by date.
        try {
            const data = await apiClient.get('/api/patients?page=1&pageSize=1');
            if (data.items && data.items.length > 0) {
                handleSelectPatient(data.items[0]);
            }
        } catch (e) {
            console.error("Failed to auto-select new patient", e);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-800 mb-2">Paso 1: Seleccionar Paciente</h4>
                <p className="text-sm text-slate-500">Busque un paciente existente o registre uno nuevo para comenzar la consulta.</p>
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
                    className="btn-primary"
                    onClick={() => setShowNewPatientModal(true)}
                >
                    + Nuevo Paciente
                </button>
            </div>

            {/* Error Message */}
            {error && <div className="alert alert-danger mb-4">{error}</div>}

            {/* Search Results Area */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden min-h-[300px]">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Buscando paciente...</div>
                ) : searchResults.length > 0 ? (
                    <table className="w-full text-left modern-table">
                        <thead className="bg-white border-b border-slate-200">
                            <tr>
                                <th className="p-3 font-semibold text-slate-600">Nombre</th>
                                <th className="p-3 font-semibold text-slate-600">Teléfono</th>
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

            {/* New Patient Modal overlay mapping */}
            {showNewPatientModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 110 }}>
                    <PatientForm
                        patient={null}
                        onClose={() => setShowNewPatientModal(false)}
                        onSuccess={handleNewPatientSuccess}
                    />
                </div>
            )}
        </div>
    );
};

export default WizardStep1_Patient;
