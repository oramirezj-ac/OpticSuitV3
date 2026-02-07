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
        <div className="step-patient fade-in">
            <h3>Paso 1: Identificar Paciente</h3>
            <div className="card border-0 shadow-none p-0 mb-8">
                <HistoricalPatientForm onPatientSelected={handlePatientSuccess} />
            </div>

            {/* RECENT PATIENTS SHORTCUT */}
            <div className="mt-8 pt-6 border-t border-slate-200">
                <h4 className="flex items-center gap-2 mb-2">
                    <span>🕒</span> Pacientes Recientes
                </h4>
                <p className="text-muted text-sm mb-4">
                    Seleccione uno de los últimos pacientes registrados para agilizar la captura:
                </p>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-left border-b border-slate-200">
                                <th className="p-3 font-semibold text-slate-600">Nombre Completo</th>
                                <th className="p-3 font-semibold text-slate-600">Fecha Registro</th>
                                <th className="p-3 font-semibold text-slate-600">Teléfono</th>
                                <th className="p-3 font-semibold text-slate-600 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPatients.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center p-6 text-muted">Thinking...</td>
                                </tr>
                            ) : (
                                recentPatients.map(p => (
                                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="p-3 font-medium text-slate-800">
                                            {p.nombre} {p.apellidoPaterno} {p.apellidoMaterno}
                                        </td>
                                        <td className="p-3 text-slate-600">{formatDateLong(p.fechaRegistro)}</td>
                                        <td className="p-3 text-slate-600 font-mono">{p.telefono || '-'}</td>
                                        <td className="p-3 text-right">
                                            <button
                                                className="btn btn-secondary text-xs py-1 px-3"
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
