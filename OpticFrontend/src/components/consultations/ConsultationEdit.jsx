import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import SuccessOverlay from '../common/SuccessOverlay';
import { formatDateForInput } from '../../utils/dateUtils';
import './ConsultationCreate.css';

const ConsultationEdit = ({ onNavigate, params }) => {
    // SOPORTE PARA AMBOS NOMBRES DE PARÁMETRO: 'id' (Consultas Recientes) y 'consultationId' (Historial del Paciente)
    const consultationId = params?.id || params?.consultationId;
    const [loading, setLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [tipoConsulta, setTipoConsulta] = useState('consulta_lentes');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [form, setForm] = useState({
        fecha: '',
        motivoConsulta: '',
        observaciones: '',
        diagnostico: '',
        tratamiento: '',
        costoServicio: 0,
        agudezaVisual: null
    });
    const [rawDetallesClinicos, setRawDetallesClinicos] = useState({});

    useEffect(() => {
        let isMounted = true;
        const fetchDetails = async () => {
            if (!consultationId) {
                console.warn("ConsultationEdit: No ID provided");
                setLoading(false);
                return;
            }

            // Timeout de seguridad de 10 segundos
            const timer = setTimeout(() => {
                if (isMounted && loading) {
                    console.error("Timeout: La respuesta del servidor tardó demasiado");
                    setError("El servidor no responde. Por favor, intenta de nuevo o reinicia el sistema.");
                    setLoading(false);
                }
            }, 10000);

            try {
                console.log("ConsultationEdit: Iniciando carga de ID", consultationId);
                const data = await apiClient.get(`/api/consultations/${consultationId}`);
                console.log("ConsultationEdit: Datos recibidos", data);
                
                if (!isMounted) return;
                clearTimeout(timer);

                if (!data) throw new Error("La consulta no existe o el servidor devolvió vacío.");

                setSelectedPatient(data.paciente);
                setTipoConsulta(data.tipoConsulta || 'consulta_lentes');
                
                let diag = '';
                let treat = '';
                let av = null;
                let dcRaw = {};
                if (data.detallesClinicos) {
                    try {
                        const dc = typeof data.detallesClinicos === 'string' 
                            ? JSON.parse(data.detallesClinicos) 
                            : data.detallesClinicos;
                        dcRaw = dc;
                        diag = dc.diagnostico || '';
                        treat = dc.tratamiento || '';
                        av = dc.agudezaVisual || null;
                    } catch (e) {
                        console.error("ConsultationEdit: Error parseando detallesClinicos", e);
                    }
                }
                setRawDetallesClinicos(dcRaw);

                // Usamos split directamente para máxima compatibilidad si formatDateForInput fallara
                const fechaInput = data.fecha ? data.fecha.split('T')[0] : '';

                setForm({
                    fecha: fechaInput,
                    motivoConsulta: data.motivoConsulta || '',
                    observaciones: data.observaciones || '',
                    diagnostico: diag,
                    tratamiento: treat,
                    costoServicio: data.costoServicio || 0,
                    agudezaVisual: av
                });
            } catch (err) {
                if (!isMounted) return;
                clearTimeout(timer);
                console.error("ConsultationEdit: Error en fetchDetails", err);
                setError("No se pudo cargar la consulta: " + (err.message || "Error de conexión"));
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDetails();
        return () => { isMounted = false; };
    }, [consultationId]);

    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Preservamos todo el JSON existente y sobrescribimos/agregamos lo nuevo
            const detallesClinicos = {
                ...rawDetallesClinicos,
                ...(tipoConsulta === 'consulta_medica' ? {
                    diagnostico: form.diagnostico,
                    tratamiento: form.tratamiento
                } : {}),
            };
            
            if (form.agudezaVisual) {
                detallesClinicos.agudezaVisual = form.agudezaVisual;
            } else {
                delete detallesClinicos.agudezaVisual;
            }

            const payload = {
                fecha: form.fecha ? new Date(form.fecha + 'T00:00:00Z').toISOString() : new Date().toISOString(),
                tipoConsulta,
                motivoConsulta: form.motivoConsulta,
                observaciones: form.observaciones,
                costoServicio: parseFloat(form.costoServicio),
                detallesClinicos
            };

            await apiClient.put(`/api/consultations/${consultationId}`, payload);
            
            setShowSuccess(true);
            const backPage = params?.patientId ? 'patient-details' : 'consultations';
            const backParams = params?.patientId ? { patientId: params.patientId } : {};
            setTimeout(() => {
                onNavigate(backPage, backParams);
            }, 2000);
        } catch (err) {
            setError(err.message || "Error al actualizar la consulta");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center"><div className="loader"></div> Cargando...</div>;

    return (
        <div className="consultation-create-container animate-fade-in shadow-xl">
            <SuccessOverlay show={showSuccess} message="Consulta Actualizada con Éxito" />
            
            <div className="module-header">
                <h2><span className="icon">✏️</span> Editar Consulta</h2>
                <button className="btn-secondary" onClick={() => params?.patientId ? onNavigate('patient-details', { patientId: params.patientId }) : onNavigate('consultations')}>Cerrar e Ir al Listado</button>
            </div>

            <div className="card">
                {selectedPatient && (
                    <div className="patient-banner mb-6">
                        <span className="label">Paciente:</span>
                        <span className="name">{selectedPatient.nombre} {selectedPatient.apellidoPaterno}</span>
                    </div>
                )}

                <form onSubmit={handleSave}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group mb-4">
                            <label>Fecha de Consulta</label>
                            <input type="date" name="fecha" className="form-input" value={form.fecha} onChange={handleFormChange} required />
                        </div>

                        <div className="form-group mb-4">
                            <label>Tipo de Consulta</label>
                            <select className="form-input" value={tipoConsulta} disabled>
                                <option value="consulta_lentes">Consulta por Lentes (Refractiva)</option>
                                <option value="consulta_medica">Consulta Médica</option>
                            </select>
                            <p className="text-xs text-slate-400 mt-1">El tipo de consulta no puede cambiarse una vez registrado.</p>
                        </div>

                        <div className="form-group mb-4">
                            <label>Motivo de Consulta</label>
                            <input type="text" name="motivoConsulta" className="form-input" value={form.motivoConsulta} onChange={handleFormChange} required />
                        </div>

                        <div className="form-group mb-4">
                            <label>Costo del Servicio ($)</label>
                            <input type="number" name="costoServicio" className="form-input" value={form.costoServicio} onChange={handleFormChange} onWheel={(e) => e.target.blur()} />
                        </div>

                        {tipoConsulta === 'consulta_medica' && (
                            <>
                                <div className="form-group md:col-span-2 mb-4">
                                    <label>Diagnóstico</label>
                                    <input type="text" name="diagnostico" className="form-input" value={form.diagnostico} onChange={handleFormChange} />
                                </div>
                                <div className="form-group md:col-span-2 mb-4">
                                    <label>Tratamiento</label>
                                    <textarea name="tratamiento" className="form-input" rows="3" value={form.tratamiento} onChange={handleFormChange} />
                                </div>
                            </>
                        )}

                        <div className="form-group md:col-span-2 mb-4">
                            <label>Observaciones Generales</label>
                            <textarea name="observaciones" className="form-input" rows="3" value={form.observaciones} onChange={handleFormChange} />
                        </div>
                    </div>

                    {error && <div className="alert alert-danger mb-4 mt-4">{error}</div>}

                    <div className="form-actions mt-8 flex justify-end gap-4">
                        <button type="button" className="btn-secondary" onClick={() => params?.patientId ? onNavigate('patient-details', { patientId: params.patientId }) : onNavigate('consultations')}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios ➔'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConsultationEdit;
