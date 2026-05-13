import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';

const VA_OPTIONS = [
    { label: "20/10", val: "2.0" },
    { label: "20/13", val: "1.5" },
    { label: "20/15", val: "1.3" },
    { label: "20/20", val: "1.0" },
    { label: "20/25", val: "0.8" },
    { label: "20/30", val: "0.6" },
    { label: "20/40", val: "0.5" },
    { label: "20/50", val: "0.4" },
    { label: "20/70", val: "0.3" },
    { label: "20/100", val: "0.2" },
    { label: "20/200", val: "0.1" },
];

const getDecimal = (val) => {
    const opt = VA_OPTIONS.find(o => o.label === val);
    return opt ? opt.val : '';
};

const VisualAcuityModal = ({ consultation, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Formulario de Agudeza Visual
    const [form, setForm] = useState({
        sc_od: '',
        sc_oi: '',
        sc_ao: '',
        cc_od: '',
        cc_oi: '',
        cc_ao: '',
        cv: ''
    });

    useEffect(() => {
        if (consultation && consultation.detallesClinicos) {
            try {
                const dc = typeof consultation.detallesClinicos === 'string' 
                    ? JSON.parse(consultation.detallesClinicos) 
                    : consultation.detallesClinicos;
                
                if (dc.agudezaVisual) {
                    setForm({
                        sc_od: dc.agudezaVisual.sc_od || '',
                        sc_oi: dc.agudezaVisual.sc_oi || '',
                        sc_ao: dc.agudezaVisual.sc_ao || '',
                        cc_od: dc.agudezaVisual.cc_od || '',
                        cc_oi: dc.agudezaVisual.cc_oi || '',
                        cc_ao: dc.agudezaVisual.cc_ao || '',
                        cv: dc.agudezaVisual.cv || ''
                    });
                    setIsEditing(false); // Mostrar en modo lectura por defecto si ya hay datos
                } else {
                    setIsEditing(true); // Modo edición si no hay datos
                }
            } catch (e) {
                console.error("Error parseando detallesClinicos para Agudeza Visual", e);
                setIsEditing(true);
            }
        } else {
            setIsEditing(true);
        }
    }, [consultation]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            // Obtener el JSON actual de la consulta
            const currentData = await apiClient.get(`/api/consultations/${consultation.id}`);
            let dc = {};
            if (currentData.detallesClinicos) {
                dc = typeof currentData.detallesClinicos === 'string' 
                    ? JSON.parse(currentData.detallesClinicos) 
                    : currentData.detallesClinicos;
            }

            // Actualizar solo el nodo de agudeza visual
            dc.agudezaVisual = form;

            // Enviar la actualización con los campos esperados por el backend
            const payload = {
                fecha: currentData.fecha,
                tipoConsulta: currentData.tipoConsulta,
                motivoConsulta: currentData.motivoConsulta,
                observaciones: currentData.observaciones,
                costoServicio: currentData.costoServicio,
                pacienteId: currentData.pacienteId,
                detallesClinicos: dc
            };

            await apiClient.put(`/api/consultations/${consultation.id}`, payload);
            
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.message || 'Error al guardar la agudeza visual');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("¿Estás seguro de eliminar los datos de agudeza visual para esta consulta?")) return;
        
        setLoading(true);
        setError(null);
        try {
            const currentData = await apiClient.get(`/api/consultations/${consultation.id}`);
            let dc = {};
            if (currentData.detallesClinicos) {
                dc = typeof currentData.detallesClinicos === 'string' 
                    ? JSON.parse(currentData.detallesClinicos) 
                    : currentData.detallesClinicos;
            }

            // Eliminar el nodo de agudeza visual
            delete dc.agudezaVisual;

            const payload = {
                fecha: currentData.fecha,
                tipoConsulta: currentData.tipoConsulta,
                motivoConsulta: currentData.motivoConsulta,
                observaciones: currentData.observaciones,
                costoServicio: currentData.costoServicio,
                pacienteId: currentData.pacienteId,
                detallesClinicos: dc
            };

            await apiClient.put(`/api/consultations/${consultation.id}`, payload);
            
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.message || 'Error al eliminar la agudeza visual');
        } finally {
            setLoading(false);
        }
    };

    if (!consultation) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content !max-w-2xl">
                <div className="modal-header">
                    <h2><span className="icon">👁️</span> Agudeza Visual</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {/* Información Contextual de la Consulta */}
                    <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-6 flex justify-between items-center text-sm">
                        <div>
                            <span className="font-semibold text-slate-700">Consulta:</span> {consultation.motivoConsulta}
                        </div>
                        <div className="text-slate-500">
                            {new Date(consultation.fecha).toLocaleDateString()}
                        </div>
                    </div>

                    {error && <div className="alert alert-danger mb-4">{error}</div>}

                    {isEditing ? (
                        <div className="animate-fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Sin Corrección (SC) */}
                                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                    <h4 className="text-sm font-bold text-slate-600 mb-2 border-b pb-1 text-center uppercase">Sin Corrección</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                                            <label className="w-8 font-bold text-slate-800 text-sm">AO</label>
                                            <select name="sc_ao" value={form.sc_ao} onChange={handleChange} className="form-select text-sm py-1 font-bold bg-white flex-1 cursor-pointer">
                                                <option value="">-</option>
                                                {VA_OPTIONS.map(opt => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
                                            </select>
                                            <span className="w-6 text-right text-xs font-mono text-slate-400 font-semibold" title="Decimal equivalente">{getDecimal(form.sc_ao)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="w-8 font-semibold text-slate-700 text-sm">OD</label>
                                            <select name="sc_od" value={form.sc_od} onChange={handleChange} className="form-select text-sm py-1 bg-white flex-1 cursor-pointer">
                                                <option value="">-</option>
                                                {VA_OPTIONS.map(opt => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
                                            </select>
                                            <span className="w-6 text-right text-xs font-mono text-slate-400 font-semibold" title="Decimal equivalente">{getDecimal(form.sc_od)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="w-8 font-semibold text-slate-700 text-sm">OI</label>
                                            <select name="sc_oi" value={form.sc_oi} onChange={handleChange} className="form-select text-sm py-1 bg-white flex-1 cursor-pointer">
                                                <option value="">-</option>
                                                {VA_OPTIONS.map(opt => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
                                            </select>
                                            <span className="w-6 text-right text-xs font-mono text-slate-400 font-semibold" title="Decimal equivalente">{getDecimal(form.sc_oi)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Con Corrección (CC) */}
                                <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                    <h4 className="text-sm font-bold text-blue-700 mb-2 border-b border-blue-200 pb-1 text-center uppercase">Con Corrección</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 pb-1 border-b border-blue-200">
                                            <label className="w-8 font-bold text-blue-900 text-sm">AO</label>
                                            <select name="cc_ao" value={form.cc_ao} onChange={handleChange} className="form-select border-blue-200 focus:border-blue-500 focus:ring-blue-500 text-sm py-1 font-bold bg-white flex-1 cursor-pointer">
                                                <option value="">-</option>
                                                {VA_OPTIONS.map(opt => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
                                            </select>
                                            <span className="w-6 text-right text-xs font-mono text-blue-400 font-semibold" title="Decimal equivalente">{getDecimal(form.cc_ao)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="w-8 font-semibold text-blue-800 text-sm">OD</label>
                                            <select name="cc_od" value={form.cc_od} onChange={handleChange} className="form-select border-blue-200 focus:border-blue-500 focus:ring-blue-500 text-sm py-1 bg-white flex-1 cursor-pointer">
                                                <option value="">-</option>
                                                {VA_OPTIONS.map(opt => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
                                            </select>
                                            <span className="w-6 text-right text-xs font-mono text-blue-400 font-semibold" title="Decimal equivalente">{getDecimal(form.cc_od)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="w-8 font-semibold text-blue-800 text-sm">OI</label>
                                            <select name="cc_oi" value={form.cc_oi} onChange={handleChange} className="form-select border-blue-200 focus:border-blue-500 focus:ring-blue-500 text-sm py-1 bg-white flex-1 cursor-pointer">
                                                <option value="">-</option>
                                                {VA_OPTIONS.map(opt => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
                                            </select>
                                            <span className="w-6 text-right text-xs font-mono text-blue-400 font-semibold" title="Decimal equivalente">{getDecimal(form.cc_oi)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Capacidad Visual (CV) */}
                            <div className="mt-2 bg-green-50 p-2 rounded border border-green-300 flex items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-base font-bold text-green-800">Capacidad Visual (CV)</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select name="cv" value={form.cv} onChange={handleChange} className="form-select border-green-400 focus:border-green-600 focus:ring-green-600 font-bold text-green-900 text-center text-base py-1 bg-white w-32 cursor-pointer">
                                        <option value="">-</option>
                                        {VA_OPTIONS.map(opt => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
                                    </select>
                                    <span className="w-8 text-right text-sm font-mono text-green-600 font-bold" title="Decimal equivalente">{getDecimal(form.cv)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                {/* SC Lectura */}
                                <div className="bg-slate-50 rounded p-2 border border-slate-200">
                                    <h5 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2 text-center border-b pb-1">Sin Corrección</h5>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm border-b border-slate-200 pb-1 mb-1"><span className="text-slate-800 font-bold">AO:</span> <span className="font-bold">{form.sc_ao || '-'}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">OD:</span> <span className="font-semibold">{form.sc_od || '-'}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">OI:</span> <span className="font-semibold">{form.sc_oi || '-'}</span></div>
                                    </div>
                                </div>

                                {/* CC Lectura */}
                                <div className="bg-blue-50 rounded p-2 border border-blue-200">
                                    <h5 className="text-sm font-bold text-blue-700 uppercase tracking-wider mb-2 text-center border-b border-blue-200 pb-1">Con Corrección</h5>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm border-b border-blue-200 pb-1 mb-1"><span className="text-blue-900 font-bold">AO:</span> <span className="font-bold text-blue-900">{form.cc_ao || '-'}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-blue-700 font-medium">OD:</span> <span className="font-semibold text-blue-800">{form.cc_od || '-'}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-blue-700 font-medium">OI:</span> <span className="font-semibold text-blue-800">{form.cc_oi || '-'}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 bg-green-50 rounded p-3 border border-green-300 flex justify-between items-center px-6">
                                <h5 className="text-base font-bold text-green-800 uppercase tracking-wider">Capacidad Visual</h5>
                                <span className="text-3xl font-bold text-green-900">{form.cv || '-'}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer flex justify-between items-center">
                    <div>
                        {!isEditing && (
                            <button 
                                type="button" 
                                className="btn text-red-600 hover:bg-red-50 py-2 px-4" 
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                🗑️ Eliminar Registro
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            {isEditing && (form.sc_od || form.cc_od) ? 'Cancelar' : 'Cerrar'}
                        </button>
                        
                        {isEditing ? (
                            <button type="button" className="btn-primary" onClick={handleSave} disabled={loading}>
                                {loading ? 'Guardando...' : 'Guardar Captura'}
                            </button>
                        ) : (
                            <button type="button" className="btn-primary" onClick={() => setIsEditing(true)}>
                                ✏️ Editar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisualAcuityModal;
