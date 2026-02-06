import React, { useState, useEffect } from 'react';
import { useHistoricalCapture } from '../../../context/HistoricalCaptureContext';
import DiopterInput from '../../common/DiopterInput';

const Step3_Graduation = () => {
    const {
        graduationForm, setGraduationForm,
        capturedData, setCapturedData,
        setLoading, setError, setCurrentStep, prevStep, loading
    } = useHistoricalCapture();

    const [existingGraduations, setExistingGraduations] = useState([]);
    const [loadingExisting, setLoadingExisting] = useState(false);

    // Fetch existing graduations if consultation is set
    useEffect(() => {
        const fetchGraduations = async () => {
            if (!capturedData.consultation?.id) return;
            // If consultation already has graduations array populated (from Include in backend), use it.
            if (capturedData.consultation.graduaciones && capturedData.consultation.graduaciones.length > 0) {
                setExistingGraduations(capturedData.consultation.graduaciones);
                return;
            }

            // Fallback: fetch endpoint (ConsultationsController has GET api/consultations/{id} which includes them)
            // We can assume capturedData.consultation might be partial if reused from step 2 list
            // Let's refetch full consultation to be sure, or rely on what we have.
            // If we reused from step 2 list, that list endpoint DOES include graduations?
            // Step 2 uses /api/consultations/patient/{id} which DOES Include(c => c.Graduaciones)

            if (capturedData.consultation.graduaciones) {
                setExistingGraduations(capturedData.consultation.graduaciones);
            }
        };
        fetchGraduations();
    }, [capturedData.consultation]);


    const handleGradChange = (e) => setGraduationForm({ ...graduationForm, [e.target.name]: e.target.value });

    const handleSelectExistingGraduation = (grad) => {
        setCapturedData(prev => ({ ...prev, graduation: grad }));
        setCurrentStep(4);
    };

    const handleSaveGraduation = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const parseIntVal = (val) => val === '' ? null : parseInt(val);

            // FIX: Correctly handle 0 values. parseFloat("0") is 0, which is falsy in JS checks like (!val)
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

            console.log("Sending Payload:", payload); // Debug log

            const response = await fetch(`/api/consultations/${capturedData.consultation.id}/graduations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Error al guardar graduación: ${errText}`);
            }
            const data = await response.json();

            setCapturedData(prev => ({ ...prev, graduation: data }));
            setCurrentStep(4);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="step-graduation">
            <h3>Paso 3: Graduación (Receta)</h3>

            {/* EXISTING GRADUATIONS SELECTOR */}
            {existingGraduations.length > 0 && (
                <div className="existing-panel mb-4 p-3 bg-slate-50 border rounded-lg">
                    <h4 className="text-sm font-bold text-slate-600 mb-2">🕶️ Graduaciones encontradas en esta consulta:</h4>
                    <div className="grid gap-2">
                        {existingGraduations.map(g => (
                            <div key={g.id} className="flex items-center justify-between bg-white p-2 border rounded shadow-sm">
                                <div className="text-xs">
                                    <strong>OD:</strong> {g.odEsfera}/{g.odCilindro}x{g.odEje}°
                                    <span className="mx-2">|</span>
                                    <strong>OI:</strong> {g.oiEsfera}/{g.oiCilindro}x{g.oiEje}°
                                </div>
                                <button
                                    className="btn-sm btn-outline-primary"
                                    onClick={() => handleSelectExistingGraduation(g)}
                                >
                                    Usar esta ➜
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="form-title-separator" style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#94a3b8' }}>
                <span style={{ flex: 1, height: '1px', background: '#cbd5e1' }}></span>
                <span style={{ padding: '0 10px', fontSize: '0.9em', fontWeight: 'bold' }}>O CAPTURE UNA NUEVA</span>
                <span style={{ flex: 1, height: '1px', background: '#cbd5e1' }}></span>
            </div>

            <div className="formula-container">
                {/* OJO DERECHO */}
                <div className="formula-row">
                    <div className="ojo-label ojo-od">OD</div>

                    <DiopterInput
                        name="od_esfera"
                        value={graduationForm.od_esfera}
                        onChange={handleGradChange}
                        min={-20} max={20}
                        placeholder="Esfera"
                    />
                    <span className="simbolo">=</span>

                    <DiopterInput
                        name="od_cilindro"
                        value={graduationForm.od_cilindro}
                        onChange={handleGradChange}
                        min={-12} max={0}
                        placeholder="Cil"
                        isCylinder={true}
                    />
                    <span className="simbolo">x</span>

                    <DiopterInput
                        name="od_eje"
                        value={graduationForm.od_eje}
                        onChange={handleGradChange}
                        min={0} max={180}
                        placeholder="Eje"
                        isAxis={true}
                    />
                    <span className="simbolo">°</span>

                    {/* ADD group */}
                    <div className="add-section">
                        <span className="label-mini">ADD</span>
                        <DiopterInput
                            name="od_adicion"
                            value={graduationForm.od_adicion}
                            onChange={handleGradChange}
                            min={0} max={4.50}
                            placeholder="+0.00"
                        />
                    </div>
                </div>

                {/* OJO IZQUIERDO */}
                <div className="formula-row">
                    <div className="ojo-label ojo-oi">OI</div>

                    <DiopterInput
                        name="oi_esfera"
                        value={graduationForm.oi_esfera}
                        onChange={handleGradChange}
                        min={-20} max={20}
                        placeholder="Esfera"
                    />
                    <span className="simbolo">=</span>

                    <DiopterInput
                        name="oi_cilindro"
                        value={graduationForm.oi_cilindro}
                        onChange={handleGradChange}
                        min={-12} max={0}
                        placeholder="Cil"
                        isCylinder={true}
                    />
                    <span className="simbolo">x</span>

                    <DiopterInput
                        name="oi_eje"
                        value={graduationForm.oi_eje}
                        onChange={handleGradChange}
                        min={0} max={180}
                        placeholder="Eje"
                        isAxis={true}
                    />
                    <span className="simbolo">°</span>

                    <div className="add-section">
                        <span className="label-mini">ADD</span>
                        <DiopterInput
                            name="oi_adicion"
                            value={graduationForm.oi_adicion}
                            onChange={handleGradChange}
                            min={0} max={4.50}
                            placeholder="+0.00"
                        />
                    </div>
                </div>
            </div>

            {/* DP Section */}
            <div className="dp-container">
                <label style={{ fontWeight: 'bold', color: '#475569' }}>Distancia Pupilar (DP):</label>
                <input
                    type="text"
                    name="dp"
                    value={graduationForm.dp}
                    onChange={handleGradChange}
                    className="form-input"
                    placeholder="mm"
                    style={{ maxWidth: '120px', textAlign: 'center' }}
                />
            </div>

            <div className="form-actions">
                <button className="btn-secondary" onClick={prevStep}>Atrás</button>
                <button className="btn-primary" onClick={handleSaveGraduation} disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar y Continuar →'}
                </button>
            </div>
        </div>
    );
};

export default Step3_Graduation;
