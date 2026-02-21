import React, { useState } from 'react';
import { useConsultations } from '../../../context/consultations/ConsultationsContext';
import DiopterInput from '../../common/DiopterInput';
import { apiClient } from '../../../services/apiClient';

const WizardStep3_Graduation = () => {
    const {
        capturedData,
        setCapturedData,
        nextStep,
        prevStep,
        setLoading,
        loading,
        error,
        setError
    } = useConsultations();

    const [graduationForm, setGraduationForm] = useState({
        od_esfera: '', od_cilindro: '', od_eje: '', od_adicion: '',
        oi_esfera: '', oi_cilindro: '', oi_eje: '', oi_adicion: '',
        dp: ''
    });

    const handleGradChange = (e) => setGraduationForm({ ...graduationForm, [e.target.name]: e.target.value });

    const handleSaveGraduation = async () => {
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
                tipoGraduacion: 'Final',
                odEsfera: cleanAndParse(graduationForm.od_esfera),
                odCilindro: cleanAndParse(graduationForm.od_cilindro),
                odEje: parseIntVal(graduationForm.od_eje),
                odAdicion: cleanAndParse(graduationForm.od_adicion),
                oiEsfera: cleanAndParse(graduationForm.oi_esfera),
                oiCilindro: cleanAndParse(graduationForm.oi_cilindro),
                oiEje: parseIntVal(graduationForm.oi_eje),
                oiAdicion: cleanAndParse(graduationForm.oi_adicion),
                detallesMontaje: {
                    dp: graduationForm.dp,
                    av_od: '',
                    av_oi: ''
                }
            };

            const response = await apiClient.post(`/api/consultations/${capturedData.consultation.id}/graduations`, payload);

            setCapturedData(prev => ({ ...prev, graduation: response }));
            nextStep(); // Move to Step 4 (Sale)
        } catch (err) {
            console.error("Failed to save graduation:", err);
            setError(err.message || 'Error al guardar la graduación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-800 mb-2">Paso 3: Captura de Refracción (Lentes)</h4>
                <p className="text-sm text-slate-500">Capture la graduación final indicada para el paciente.</p>
            </div>

            {error && <div className="alert alert-danger mb-4">{error}</div>}

            <div className="formula-container border border-slate-200 rounded-lg p-4 bg-slate-50 overflow-hidden">
                {/* OJO DERECHO */}
                <div className="formula-row flex items-center mb-4 flex-wrap gap-2">
                    <div className="ojo-label ojo-od text-2xl font-bold w-12" style={{ color: '#2563eb' }}>OD</div>

                    <DiopterInput name="od_esfera" value={graduationForm.od_esfera} onChange={handleGradChange} min={-20} max={20} placeholder="Esfera" />
                    <span className="simbolo text-slate-400 text-lg font-bold px-1 select-none">=</span>
                    <DiopterInput name="od_cilindro" value={graduationForm.od_cilindro} onChange={handleGradChange} min={-12} max={0} placeholder="Cil" isCylinder={true} />
                    <span className="simbolo text-slate-400 text-lg font-bold px-1 select-none">x</span>
                    <DiopterInput name="od_eje" value={graduationForm.od_eje} onChange={handleGradChange} min={0} max={180} placeholder="Eje" isAxis={true} />
                    <span className="simbolo text-slate-400 text-lg font-bold px-1 select-none">°</span>

                    <div className="add-section border-l pl-4 ml-auto border-slate-300 flex items-center gap-2">
                        <span className="label-mini text-xs font-bold text-slate-500 uppercase tracking-wider">ADD</span>
                        <DiopterInput name="od_adicion" value={graduationForm.od_adicion} onChange={handleGradChange} min={0} max={4.50} placeholder="+0.00" />
                    </div>
                </div>

                {/* OJO IZQUIERDO */}
                <div className="formula-row flex items-center flex-wrap gap-2">
                    <div className="ojo-label ojo-oi text-2xl font-bold w-12" style={{ color: '#16a34a' }}>OI</div>

                    <DiopterInput name="oi_esfera" value={graduationForm.oi_esfera} onChange={handleGradChange} min={-20} max={20} placeholder="Esfera" />
                    <span className="simbolo text-slate-400 text-lg font-bold px-1 select-none">=</span>
                    <DiopterInput name="oi_cilindro" value={graduationForm.oi_cilindro} onChange={handleGradChange} min={-12} max={0} placeholder="Cil" isCylinder={true} />
                    <span className="simbolo text-slate-400 text-lg font-bold px-1 select-none">x</span>
                    <DiopterInput name="oi_eje" value={graduationForm.oi_eje} onChange={handleGradChange} min={0} max={180} placeholder="Eje" isAxis={true} />
                    <span className="simbolo text-slate-400 text-lg font-bold px-1 select-none">°</span>

                    <div className="add-section border-l pl-4 ml-auto border-slate-300 flex items-center gap-2">
                        <span className="label-mini text-xs font-bold text-slate-500 uppercase tracking-wider">ADD</span>
                        <DiopterInput name="oi_adicion" value={graduationForm.oi_adicion} onChange={handleGradChange} min={0} max={4.50} placeholder="+0.00" />
                    </div>
                </div>
            </div>

            {/* DP Section */}
            <div className="dp-container bg-white p-4 rounded-lg mt-6 flex justify-center items-center gap-4 border border-slate-200 shadow-sm">
                <label className="font-bold text-slate-700">Distancia Pupilar (DP):</label>
                <input
                    type="text"
                    name="dp"
                    value={graduationForm.dp}
                    onChange={handleGradChange}
                    className="form-input text-center font-bold text-lg"
                    placeholder="mm"
                    style={{ maxWidth: '120px' }}
                />
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button className="btn-secondary" onClick={prevStep} disabled={loading}>Atrás</button>
                <button className="btn-primary" onClick={handleSaveGraduation} disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar y Continuar ➜'}
                </button>
            </div>
        </div>
    );
};

export default WizardStep3_Graduation;
