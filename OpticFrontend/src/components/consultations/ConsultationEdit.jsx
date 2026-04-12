import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import SuccessOverlay from '../common/SuccessOverlay';
import './ConsultationCreate.css';

const ConsultationEdit = ({ onNavigate, params }) => {
    const consultationId = params?.id;
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
        costoServicio: 0
    });

    useEffect(() => {
        const fetchDetails = async () => {
            if (!consultationId) return;
            try {
                const data = await apiClient.get(`/api/consultations/${consultationId}`);
                setSelectedPatient(data.paciente);
                setTipoConsulta(data.tipoConsulta);
                
                let diag = '';
                let treat = '';
                if (data.detallesClinicos) {
                    try {
                        const dc = JSON.parse(data.detallesClinicos);
                        diag = dc.diagnostico || '';
                        treat = dc.tratamiento || '';
                    } catch (e) {}
                }

                setForm({
                    fecha: data.fecha.split('T')[0],
                    motivoConsulta: data.motivoConsulta,
                    observaciones: data.observaciones,
                    diagnostico: diag,
                    tratamiento: treat,
                    costoServicio: data.costoServicio
                });
            } catch (err) {
                setError("Error al cargar detalles de la consulta");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [consultationId]);

    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const detallesClinicos = tipoConsulta === 'consulta_medica' ? {
                diagnostico: form.diagnostico,
                tratamiento: form.tratamiento
            } : {};

            const payload = {
                fecha: new Date(form.fecha).toISOString(),
                tipoConsulta,
                motivoConsulta: form.motivoConsulta,
                observaciones: form.observaciones,
                costoServicio: parseFloat(form.costoServicio),
                detallesClinicos
            };

            await apiClient.put(`/api/consultations/${consultationId}`, payload);
            
            setShowSuccess(true);
            setTimeout(() => {
                onNavigate('consultations');
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
            <SuccessOverlay show={showSuccess} message="Cambios Guardados" />
            
            <div className="module-header">
                <h2><span className="icon">✏️</span> Editar Consulta</h2>
                <button className="btn-secondary" onClick={() => onNavigate('consultations')}>Cerrar e Ir al Listado</button>
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
                            <input type="number" name="costoServicio" className="form-input" value={form.costoServicio} onChange={handleFormChange} />
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

                    {error && <div className="alert alert-danger mb-4">{error}</div>}

                    <div className="form-actions mt-8 flex justify-end gap-4">
                        <button type="button" className="btn-secondary" onClick={() => onNavigate('consultations')}>Cancelar</button>
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
