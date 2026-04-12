import React, { useState, useEffect } from 'react';
import DiopterInput from '../common/DiopterInput';
import SuccessOverlay from '../common/SuccessOverlay';
import GraduationCard from '../common/GraduationCard';
import { apiClient } from '../../services/apiClient';
import './GraduationCreate.css';

const GraduationCreate = ({ onNavigate, params }) => {
    const { consultationId, patientId, patientName } = params || {};
    
    const [graduationForm, setGraduationForm] = useState({
        tipoGraduacion: 'Final',
        od_esfera: '', od_cilindro: '', od_eje: '', od_adicion: '',
        oi_esfera: '', oi_cilindro: '', oi_eje: '', oi_adicion: '',
        dp: ''
    });
    const [sessionGraduations, setSessionGraduations] = useState([]);

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [lastSavedId, setLastSavedId] = useState(null);

    useEffect(() => {
        const fetchSessionGrads = async () => {
            if (!consultationId) return;
            try {
                const response = await apiClient.get(`/api/consultations/${consultationId}`);
                if (response.graduaciones) {
                    setSessionGraduations(response.graduaciones);
                }
            } catch (err) {
                console.error("Error loading session grads:", err);
            }
        };
        fetchSessionGrads();
    }, [consultationId]);

    const handleGradChange = (e) => setGraduationForm({ ...graduationForm, [e.target.name]: e.target.value });

    const handleSave = async (e, mode = 'finish') => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const parseIntVal = (val) => val === '' ? null : parseInt(val);
            const cleanAndParse = (val) => {
                if (val === '' || val === null || val === undefined) return null;
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
            };

            const payload = {
                tipoGraduacion: graduationForm.tipoGraduacion,
                odEsfera: cleanAndParse(graduationForm.od_esfera),
                odCilindro: cleanAndParse(graduationForm.od_cilindro),
                odEje: parseIntVal(graduationForm.od_eje),
                odAdicion: cleanAndParse(graduationForm.od_adicion),
                oiEsfera: cleanAndParse(graduationForm.oi_esfera),
                oiCilindro: cleanAndParse(graduationForm.oi_cilindro),
                oiEje: parseIntVal(graduationForm.oi_eje),
                oiAdicion: cleanAndParse(graduationForm.oi_adicion),
                detallesMontaje: JSON.stringify({
                    dp: graduationForm.dp,
                    av_od: '',
                    av_oi: ''
                })
            };

            const response = await apiClient.post(`/api/consultations/${consultationId}/graduations`, payload);
            
            // Actualizar historial local
            setSessionGraduations(prev => [...prev, response]);
            setLastSavedId(response.id);
            
            if (mode === 'finish') {
                setShowSuccess(true);
                setTimeout(() => {
                    onNavigate('sales-create', { 
                        patientId, 
                        consultationId, 
                        graduationId: response.id 
                    });
                }, 2000);
            } else {
                // Reset form but keep DP for consistency
                setGraduationForm({
                    ...graduationForm,
                    tipoGraduacion: 'Final',
                    od_esfera: '', od_cilindro: '', od_eje: '', od_adicion: '',
                    oi_esfera: '', oi_cilindro: '', oi_eje: '', oi_adicion: '',
                });
                // Small notification instead of native alert
                const notify = document.createElement('div');
                notify.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 animate-bounce';
                notify.innerText = 'Etapa Guardada. Captura la siguiente.';
                document.body.appendChild(notify);
                setTimeout(() => notify.remove(), 3000);
            }
        } catch (err) {
            console.error("Failed to save graduation:", err);
            setError(err.message || 'Error al guardar la graduación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="graduation-create-container animate-fade-in">
            <SuccessOverlay show={showSuccess} message="Graduación Guardada Correctamente" />
            <div className="graduation-header">
                <h2><span className="icon">👓</span> Captura de Refracción (Graduación)</h2>
                <div className="patient-context">
                    Paciente: <strong>{patientName || 'Cargando...'}</strong>
                </div>
            </div>

            <form onSubmit={(e) => handleSave(e, 'finish')} className="card">
                {error && <div className="alert alert-danger mb-4">{error}</div>}

                <div className="tipo-selector mb-6">
                    <label className="block text-sm font-bold text-slate-600 mb-3">Etapa de la Consulta:</label>
                    <div className="flex flex-wrap gap-2">
                        {['Autoref', 'Rx Anterior', 'Phoroptor', 'Rx Externa', 'Final'].map(tipo => (
                            <button
                                key={tipo}
                                type="button"
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    graduationForm.tipoGraduacion === tipo 
                                    ? 'bg-blue-600 text-white shadow-md' 
                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                                }`}
                                onClick={() => setGraduationForm({...graduationForm, tipoGraduacion: tipo})}
                            >
                                {tipo}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="formula-container border border-slate-200 rounded-lg p-6 bg-slate-50 overflow-hidden shadow-inner">
                    {/* OJO DERECHO */}
                    <div className="formula-row flex items-center mb-6 flex-wrap gap-4">
                        <div className="ojo-label ojo-od text-3xl font-bold w-16" style={{ color: '#2563eb' }}>OD</div>

                        <div className="input-group-grad">
                            <label>Esfera</label>
                            <DiopterInput name="od_esfera" value={graduationForm.od_esfera} onChange={handleGradChange} min={-20} max={20} placeholder="0.00" />
                        </div>
                        <span className="simbolo text-slate-400 text-2xl font-bold pt-6">=</span>
                        <div className="input-group-grad">
                            <label>Cilindro</label>
                            <DiopterInput name="od_cilindro" value={graduationForm.od_cilindro} onChange={handleGradChange} min={-12} max={0} placeholder="-0.00" isCylinder={true} />
                        </div>
                        <span className="simbolo text-slate-400 text-2xl font-bold pt-6">x</span>
                        <div className="input-group-grad">
                            <label>Eje</label>
                            <DiopterInput name="od_eje" value={graduationForm.od_eje} onChange={handleGradChange} min={0} max={180} placeholder="0°" isAxis={true} />
                        </div>

                        <div className="add-section border-l pl-6 ml-auto border-slate-300 flex items-center gap-4">
                            <div className="input-group-grad">
                                <label className="text-blue-600 font-black">ADICIÓN (ADD)</label>
                                <DiopterInput name="od_adicion" value={graduationForm.od_adicion} onChange={handleGradChange} min={0} max={4.50} placeholder="+0.00" />
                            </div>
                        </div>
                    </div>

                    <div className="divider mb-6 border-b border-slate-200"></div>

                    {/* OJO IZQUIERDO */}
                    <div className="formula-row flex items-center flex-wrap gap-4">
                        <div className="ojo-label ojo-oi text-3xl font-bold w-16" style={{ color: '#16a34a' }}>OI</div>

                        <div className="input-group-grad">
                            <label>Esfera</label>
                            <DiopterInput name="oi_esfera" value={graduationForm.oi_esfera} onChange={handleGradChange} min={-20} max={20} placeholder="0.00" />
                        </div>
                        <span className="simbolo text-slate-400 text-2xl font-bold pt-6">=</span>
                        <div className="input-group-grad">
                            <label>Cilindro</label>
                            <DiopterInput name="oi_cilindro" value={graduationForm.oi_cilindro} onChange={handleGradChange} min={-12} max={0} placeholder="-0.00" isCylinder={true} />
                        </div>
                        <span className="simbolo text-slate-400 text-2xl font-bold pt-6">x</span>
                        <div className="input-group-grad">
                            <label>Eje</label>
                            <DiopterInput name="oi_eje" value={graduationForm.oi_eje} onChange={handleGradChange} min={0} max={180} placeholder="0°" isAxis={true} />
                        </div>

                        <div className="add-section border-l pl-6 ml-auto border-slate-300 flex items-center gap-4">
                            <div className="input-group-grad">
                                <label className="text-green-600 font-black">ADICIÓN (ADD)</label>
                                <DiopterInput name="oi_adicion" value={graduationForm.oi_adicion} onChange={handleGradChange} min={0} max={4.50} placeholder="+0.00" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bottom-row flex justify-between items-center mt-8">
                    <div className="dp-box bg-blue-50 p-4 rounded-lg flex items-center gap-4 border border-blue-100">
                        <label className="font-bold text-blue-800">Distancia Pupilar (DP):</label>
                        <input
                            type="text"
                            name="dp"
                            value={graduationForm.dp}
                            onChange={handleGradChange}
                            className="form-input text-center font-bold text-xl"
                            placeholder="mm"
                            style={{ maxWidth: '100px' }}
                        />
                    </div>

                    <div className="actions flex gap-4">
                        <button type="button" className="btn-secondary" onClick={() => onNavigate('patient-details', { patientId })}>Cancelar</button>
                        <button 
                            type="button" 
                            className="bg-slate-100 text-slate-700 px-6 py-3 rounded-lg font-bold border border-slate-200 hover:bg-slate-200" 
                            onClick={() => handleSave(null, 'next')}
                            disabled={loading}
                        >
                            Guardar y Capturar Otra
                        </button>
                        <button type="submit" className="btn-primary" style={{ padding: '12px 30px' }} disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar y Generar Venta ➔'}
                        </button>
                    </div>
                </div>

                {sessionGraduations.length > 0 && (
                    <div className="session-history mt-10 border-t pt-8">
                        <h3 className="text-lg font-bold text-slate-700 mb-4">Lecturas registradas hoy:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sessionGraduations.map((g, idx) => (
                                <GraduationCard 
                                    key={idx} 
                                    graduation={g} 
                                    title={`${g.tipoGraduacion} (#${idx + 1})`} 
                                />
                            ))}
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default GraduationCreate;
