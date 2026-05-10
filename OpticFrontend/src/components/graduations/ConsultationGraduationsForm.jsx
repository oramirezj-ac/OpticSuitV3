import React from 'react';
import DiopterInput from '../common/DiopterInput';
import { TIPOS } from './useConsultationGraduations';

const ConsultationGraduationsForm = ({ 
    form, 
    handleGradChange, 
    handleSave, 
    cancelForm, 
    savingForm, 
    editingId, 
    formError, 
    setForm 
}) => {
    return (
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
    );
};

export default ConsultationGraduationsForm;
