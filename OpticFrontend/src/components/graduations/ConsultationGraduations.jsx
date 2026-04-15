import React, { useState, useEffect } from 'react';
import DiopterInput from '../common/DiopterInput';
import GraduationCard from '../common/GraduationCard';
import SuccessOverlay from '../common/SuccessOverlay';
import { apiClient } from '../../services/apiClient';
import { formatDateLong } from '../../utils/dateUtils';
import './GraduationCreate.css';

const EMPTY_FORM = {
    tipoGraduacion: 'Final',
    od_esfera: '', od_cilindro: '', od_eje: '', od_adicion: '',
    oi_esfera: '', oi_cilindro: '', oi_eje: '', oi_adicion: '',
    dp: ''
};

const TIPOS = ['Autoref', 'Rx Anterior', 'Phoroptor', 'Rx Externa', 'Final'];

const ConsultationGraduations = ({ onNavigate, params }) => {
    const { consultationId, patientId } = params || {};

    const [consultation, setConsultation] = useState(null);
    const [graduations, setGraduations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form (Add / Edit)
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null); // null = nuevo
    const [form, setForm] = useState(EMPTY_FORM);
    const [savingForm, setSavingForm] = useState(false);
    const [formError, setFormError] = useState(null);

    // Success notification
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Delete confirmation
    const [deletingId, setDeletingId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadConsultation();
    }, [consultationId]);

    const loadConsultation = async () => {
        if (!consultationId) {
            setError('No se especificó una consulta.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.get(`/api/consultations/${consultationId}`);
            setConsultation(data);
            setGraduations(data.graduaciones || []);
        } catch (err) {
            setError(err.message || 'Error al cargar la consulta');
        } finally {
            setLoading(false);
        }
    };

    // ── Helpers ────────────────────────────────────────────────────────────────
    const parseNum = (val) => {
        if (val === '' || val === null || val === undefined) return null;
        const n = parseFloat(val);
        return isNaN(n) ? null : n;
    };

    const parseIntVal = (val) => {
        if (val === '' || val === null || val === undefined) return null;
        const n = parseInt(val, 10);
        return isNaN(n) ? null : n;
    };

    const buildPayload = () => ({
        tipoGraduacion: form.tipoGraduacion,
        odEsfera: parseNum(form.od_esfera),
        odCilindro: parseNum(form.od_cilindro),
        odEje: parseIntVal(form.od_eje),
        odAdicion: parseNum(form.od_adicion),
        oiEsfera: parseNum(form.oi_esfera),
        oiCilindro: parseNum(form.oi_cilindro),
        oiEje: parseIntVal(form.oi_eje),
        oiAdicion: parseNum(form.oi_adicion),
        detallesMontaje: { dp: form.dp, av_od: '', av_oi: '' }
    });

    const showNotification = (msg) => {
        setSuccessMsg(msg);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    // ── Form Handlers ──────────────────────────────────────────────────────────
    const openAddForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setFormError(null);
        setShowForm(true);
        // scroll to form
        setTimeout(() => document.getElementById('grad-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    };

    const openEditForm = (grad) => {
        const getDp = () => {
            try {
                const dm = typeof grad.detallesMontaje === 'string'
                    ? JSON.parse(grad.detallesMontaje)
                    : grad.detallesMontaje;
                return dm?.dp ?? '';
            } catch { return ''; }
        };
        setForm({
            tipoGraduacion: grad.tipoGraduacion || 'Final',
            od_esfera: grad.odEsfera ?? '',
            od_cilindro: grad.odCilindro ?? '',
            od_eje: grad.odEje ?? '',
            od_adicion: grad.odAdicion ?? '',
            oi_esfera: grad.oiEsfera ?? '',
            oi_cilindro: grad.oiCilindro ?? '',
            oi_eje: grad.oiEje ?? '',
            oi_adicion: grad.oiAdicion ?? '',
            dp: getDp()
        });
        setEditingId(grad.id);
        setFormError(null);
        setShowForm(true);
        setTimeout(() => document.getElementById('grad-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormError(null);
    };

    const handleGradChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSavingForm(true);
        setFormError(null);
        try {
            if (editingId) {
                const updated = await apiClient.put(`/api/consultations/graduations/${editingId}`, buildPayload());
                // merge the updated object into the list
                setGraduations(prev => prev.map(g => g.id === editingId ? { ...g, ...updated } : g));
                showNotification('Graduación actualizada correctamente');
            } else {
                const created = await apiClient.post(`/api/consultations/${consultationId}/graduations`, buildPayload());
                setGraduations(prev => [...prev, created]);
                showNotification('Graduación guardada correctamente');
            }
            cancelForm();
        } catch (err) {
            setFormError(err.message || 'Error al guardar la graduación');
        } finally {
            setSavingForm(false);
        }
    };

    // ── Delete Handlers ────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            await apiClient.delete(`/api/consultations/graduations/${id}`);
            setGraduations(prev => prev.filter(g => g.id !== id));
            setDeletingId(null);
            showNotification('Graduación eliminada');
        } catch (err) {
            setError(err.message || 'Error al eliminar la graduación');
        } finally {
            setDeleting(false);
        }
    };

    // ── Navigation ─────────────────────────────────────────────────────────────
    const goBack = () => {
        if (patientId) {
            onNavigate('patient-details', { patientId, initialTab: 'consultations_lenses' });
        } else {
            onNavigate('consultations');
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    if (loading) return <div className="loading-container"><div className="loader"></div></div>;

    if (error && !consultation) return (
        <div className="graduation-create-container">
            <div className="alert alert-danger">{error}</div>
            <button className="btn-secondary" onClick={goBack}>← Regresar</button>
        </div>
    );

    const patient = consultation?.paciente;

    return (
        <div className="graduation-create-container animate-fade-in">
            <SuccessOverlay show={showSuccess} message={successMsg} />

            {/* ── PAGE HEADER ────────────────────────────────────────────────── */}
            <div className="graduation-header">
                <div>
                    <h2><span className="icon">👓</span> Graduaciones de Consulta</h2>
                    <div className="patient-context" style={{ marginTop: '4px' }}>
                        Paciente:&nbsp;
                        <strong>{patient ? `${patient.nombre} ${patient.apellidoPaterno || ''}` : '—'}</strong>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" onClick={goBack}>← Regresar al Expediente</button>
                    {graduations.length > 0 && (
                        <button
                            className="btn-primary"
                            style={{ background: '#10b981' }}
                            onClick={() => onNavigate('sales-create', { patientId, consultationId })}
                        >
                            💰 Generar Venta
                        </button>
                    )}
                </div>
            </div>

            {/* ── CONSULTATION SUMMARY CARD ──────────────────────────────────── */}
            {consultation && (
                <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    marginBottom: '20px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '12px'
                }}>
                    {[
                        { label: 'Fecha', value: formatDateLong(consultation.fecha) },
                        { label: 'Motivo', value: consultation.motivoConsulta },
                        { label: 'Tipo', value: consultation.tipoConsulta === 'consulta_lentes' ? 'Consulta por Lentes' : 'Consulta Médica', color: '#3b82f6' },
                        { label: 'Graduaciones', value: `${graduations.length} registrada${graduations.length !== 1 ? 's' : ''}`, color: graduations.length > 0 ? '#10b981' : '#94a3b8' }
                    ].map(({ label, value, color }) => (
                        <div key={label}>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{label}</div>
                            <div style={{ fontWeight: '600', color: color || '#1e293b' }}>{value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── GRADUATIONS LIST ───────────────────────────────────────────── */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#1e293b' }}>
                        Lecturas Registradas
                    </h3>
                    {!showForm && (
                        <button className="btn-primary" style={{ fontSize: '0.875rem' }} onClick={openAddForm}>
                            + Nueva Graduación
                        </button>
                    )}
                </div>

                {error && <div className="alert alert-danger mb-4">{error}</div>}

                {graduations.length === 0 && !showForm ? (
                    <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👓</div>
                        <p style={{ color: '#94a3b8', marginBottom: '16px', fontWeight: '500' }}>
                            No hay graduaciones registradas para esta consulta.
                        </p>
                        <button className="btn-primary" onClick={openAddForm}>
                            + Agregar la primera graduación
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                        {graduations.map((g) => (
                            <div key={g.id} style={{ position: 'relative' }}>
                                <GraduationCard graduation={g} title={g.tipoGraduacion || 'Lectura'} />

                                {/* Delete confirmation overlay */}
                                {deletingId === g.id ? (
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        background: 'rgba(185,28,28,0.95)', borderRadius: '0 0 10px 10px',
                                        padding: '10px 14px', display: 'flex',
                                        justifyContent: 'space-between', alignItems: 'center', gap: '8px'
                                    }}>
                                        <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>
                                            ¿Eliminar esta graduación?
                                        </span>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                style={{ background: '#fff', color: '#b91c1c', border: 'none', borderRadius: '6px', padding: '4px 12px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}
                                                onClick={() => handleDelete(g.id)}
                                                disabled={deleting}
                                            >
                                                {deleting ? '...' : 'Sí, eliminar'}
                                            </button>
                                            <button
                                                style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.7)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem' }}
                                                onClick={() => setDeletingId(null)}
                                                disabled={deleting}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                                        <button
                                            className="btn-secondary"
                                            style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                                            onClick={() => openEditForm(g)}
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                                            onClick={() => setDeletingId(g.id)}
                                        >
                                            🗑️ Eliminar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── ADD / EDIT FORM ────────────────────────────────────────────── */}
            {showForm && (
                <form id="grad-form" onSubmit={handleSave} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>
                            {editingId ? '✏️ Editar Graduación' : '+ Nueva Graduación'}
                        </h3>
                        <button type="button" className="btn-secondary" style={{ fontSize: '0.85rem' }} onClick={cancelForm}>
                            Cancelar
                        </button>
                    </div>

                    {formError && <div className="alert alert-danger mb-4">{formError}</div>}

                    {/* Tipo selector */}
                    <div className="tipo-selector mb-6">
                        <label className="block text-sm font-bold text-slate-600 mb-3">Etapa de la Consulta:</label>
                        <div className="flex flex-wrap gap-2">
                            {TIPOS.map(tipo => (
                                <button
                                    key={tipo}
                                    type="button"
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                        form.tipoGraduacion === tipo
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                                    }`}
                                    onClick={() => setForm(prev => ({ ...prev, tipoGraduacion: tipo }))}
                                >
                                    {tipo}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Formula grid */}
                    <div className="formula-container border border-slate-200 rounded-lg p-6 bg-slate-50 overflow-hidden shadow-inner">
                        {/* OD */}
                        <div className="formula-row flex items-center mb-6 flex-wrap gap-4">
                            <div className="ojo-label ojo-od text-3xl font-bold w-16" style={{ color: '#2563eb' }}>OD</div>
                            <div className="input-group-grad">
                                <label>Esfera</label>
                                <DiopterInput name="od_esfera" value={form.od_esfera} onChange={handleGradChange} min={-20} max={20} placeholder="0.00" />
                            </div>
                            <span className="simbolo text-slate-400 text-2xl font-bold pt-6">=</span>
                            <div className="input-group-grad">
                                <label>Cilindro</label>
                                <DiopterInput name="od_cilindro" value={form.od_cilindro} onChange={handleGradChange} min={-12} max={0} placeholder="-0.00" isCylinder={true} />
                            </div>
                            <span className="simbolo text-slate-400 text-2xl font-bold pt-6">x</span>
                            <div className="input-group-grad">
                                <label>Eje</label>
                                <DiopterInput name="od_eje" value={form.od_eje} onChange={handleGradChange} min={0} max={180} placeholder="0°" isAxis={true} />
                            </div>
                            <div className="add-section border-l pl-6 ml-auto border-slate-300 flex items-center gap-4">
                                <div className="input-group-grad">
                                    <label className="text-blue-600 font-black">ADICIÓN (ADD)</label>
                                    <DiopterInput name="od_adicion" value={form.od_adicion} onChange={handleGradChange} min={0} max={4.50} placeholder="+0.00" />
                                </div>
                            </div>
                        </div>

                        <div className="divider mb-6 border-b border-slate-200"></div>

                        {/* OI */}
                        <div className="formula-row flex items-center flex-wrap gap-4">
                            <div className="ojo-label ojo-oi text-3xl font-bold w-16" style={{ color: '#16a34a' }}>OI</div>
                            <div className="input-group-grad">
                                <label>Esfera</label>
                                <DiopterInput name="oi_esfera" value={form.oi_esfera} onChange={handleGradChange} min={-20} max={20} placeholder="0.00" />
                            </div>
                            <span className="simbolo text-slate-400 text-2xl font-bold pt-6">=</span>
                            <div className="input-group-grad">
                                <label>Cilindro</label>
                                <DiopterInput name="oi_cilindro" value={form.oi_cilindro} onChange={handleGradChange} min={-12} max={0} placeholder="-0.00" isCylinder={true} />
                            </div>
                            <span className="simbolo text-slate-400 text-2xl font-bold pt-6">x</span>
                            <div className="input-group-grad">
                                <label>Eje</label>
                                <DiopterInput name="oi_eje" value={form.oi_eje} onChange={handleGradChange} min={0} max={180} placeholder="0°" isAxis={true} />
                            </div>
                            <div className="add-section border-l pl-6 ml-auto border-slate-300 flex items-center gap-4">
                                <div className="input-group-grad">
                                    <label className="text-green-600 font-black">ADICIÓN (ADD)</label>
                                    <DiopterInput name="oi_adicion" value={form.oi_adicion} onChange={handleGradChange} min={0} max={4.50} placeholder="+0.00" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DP + Submit */}
                    <div className="bottom-row flex justify-between items-center mt-8">
                        <div className="dp-box bg-blue-50 p-4 rounded-lg flex items-center gap-4 border border-blue-100">
                            <label className="font-bold text-blue-800">Distancia Pupilar (DP):</label>
                            <input
                                type="text"
                                name="dp"
                                value={form.dp}
                                onChange={handleGradChange}
                                className="form-input text-center font-bold text-xl"
                                placeholder="mm"
                                style={{ maxWidth: '100px' }}
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: '12px 30px' }} disabled={savingForm}>
                            {savingForm ? 'Guardando...' : editingId ? '💾 Guardar Cambios' : '💾 Guardar Graduación'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ConsultationGraduations;
