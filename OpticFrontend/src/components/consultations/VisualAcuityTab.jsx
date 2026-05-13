import React, { useState } from 'react';

const VisualAcuityTab = ({ agudezaVisual, onSave, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState(agudezaVisual || {
        sc_od: '', sc_oi: '', sc_ao: '',
        cc_od: '', cc_oi: '', cc_ao: '',
        cv: ''
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        onSave(form);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setForm(agudezaVisual || {
            sc_od: '', sc_oi: '', sc_ao: '',
            cc_od: '', cc_oi: '', cc_ao: '',
            cv: ''
        });
        setIsEditing(false);
    };

    if (!agudezaVisual && !isEditing) {
        return (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 border-dashed mt-4">
                <p className="text-slate-500 mb-4">No hay datos de Agudeza Visual registrados para esta consulta.</p>
                <button type="button" className="btn-primary" onClick={() => setIsEditing(true)}>
                    + Capturar Agudeza Visual
                </button>
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mt-4">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Capturar Agudeza Visual</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* SC (Sin Corrección) */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="font-semibold text-slate-600 mb-3 text-center border-b pb-2">Sin Corrección (SC)</h4>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <label className="w-10 text-sm font-bold text-slate-500">OD</label>
                                <input type="text" name="sc_od" value={form.sc_od} onChange={handleChange} className="form-input flex-1" placeholder="Ej. 20/40" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="w-10 text-sm font-bold text-slate-500">OI</label>
                                <input type="text" name="sc_oi" value={form.sc_oi} onChange={handleChange} className="form-input flex-1" placeholder="Ej. 20/50" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="w-10 text-sm font-bold text-slate-500">AO</label>
                                <input type="text" name="sc_ao" value={form.sc_ao} onChange={handleChange} className="form-input flex-1" placeholder="Ej. 20/30" />
                            </div>
                        </div>
                    </div>

                    {/* CC (Con Corrección) */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="font-semibold text-blue-700 mb-3 text-center border-b border-blue-200 pb-2">Con Corrección (CC)</h4>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <label className="w-10 text-sm font-bold text-blue-600">OD</label>
                                <input type="text" name="cc_od" value={form.cc_od} onChange={handleChange} className="form-input flex-1" placeholder="Ej. 20/20" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="w-10 text-sm font-bold text-blue-600">OI</label>
                                <input type="text" name="cc_oi" value={form.cc_oi} onChange={handleChange} className="form-input flex-1" placeholder="Ej. 20/20" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="w-10 text-sm font-bold text-blue-600">AO</label>
                                <input type="text" name="cc_ao" value={form.cc_ao} onChange={handleChange} className="form-input flex-1" placeholder="Ej. 20/20" />
                            </div>
                        </div>
                    </div>

                    {/* CV (Capacidad Visual) */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100 flex flex-col justify-center">
                        <h4 className="font-semibold text-green-700 mb-3 text-center border-b border-green-200 pb-2">Capacidad Visual</h4>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <label className="w-10 text-sm font-bold text-green-600">CV</label>
                                <input type="text" name="cv" value={form.cv} onChange={handleChange} className="form-input flex-1" placeholder="Ej. 20/20" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t pt-4">
                    <button type="button" className="btn-secondary" onClick={handleCancel}>Cancelar</button>
                    <button type="button" className="btn-primary" onClick={handleSave}>Aceptar Agudeza Visual</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mt-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-700">Agudeza Visual Registrada</h3>
                <div className="flex gap-2">
                    <button type="button" className="btn-secondary text-sm py-1 px-3" onClick={() => setIsEditing(true)}>✏️ Editar</button>
                    <button type="button" className="btn text-sm py-1 px-3" style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }} onClick={() => {
                        if (window.confirm("¿Estás seguro de borrar la agudeza visual de esta consulta?")) {
                            onDelete();
                        }
                    }}>🗑️ Borrar</button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* SC */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-600 mb-3 text-center border-b pb-2">Sin Corrección (SC)</h4>
                    <div className="flex flex-col gap-2 text-center">
                        <div className="flex justify-between px-4"><span className="text-slate-500 font-medium">OD:</span> <span className="font-bold text-slate-700">{agudezaVisual.sc_od || '-'}</span></div>
                        <div className="flex justify-between px-4"><span className="text-slate-500 font-medium">OI:</span> <span className="font-bold text-slate-700">{agudezaVisual.sc_oi || '-'}</span></div>
                        <div className="flex justify-between px-4 border-t pt-2 mt-1"><span className="text-slate-500 font-medium">AO:</span> <span className="font-bold text-slate-700">{agudezaVisual.sc_ao || '-'}</span></div>
                    </div>
                </div>

                {/* CC */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h4 className="font-semibold text-blue-700 mb-3 text-center border-b border-blue-200 pb-2">Con Corrección (CC)</h4>
                    <div className="flex flex-col gap-2 text-center">
                        <div className="flex justify-between px-4"><span className="text-blue-600 font-medium">OD:</span> <span className="font-bold text-blue-800">{agudezaVisual.cc_od || '-'}</span></div>
                        <div className="flex justify-between px-4"><span className="text-blue-600 font-medium">OI:</span> <span className="font-bold text-blue-800">{agudezaVisual.cc_oi || '-'}</span></div>
                        <div className="flex justify-between px-4 border-t border-blue-200 pt-2 mt-1"><span className="text-blue-600 font-medium">AO:</span> <span className="font-bold text-blue-800">{agudezaVisual.cc_ao || '-'}</span></div>
                    </div>
                </div>

                {/* CV */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-100 flex flex-col justify-center">
                    <h4 className="font-semibold text-green-700 mb-3 text-center border-b border-green-200 pb-2">Capacidad Visual</h4>
                    <div className="text-center mt-2">
                        <span className="text-2xl font-bold text-green-800">{agudezaVisual.cv || '-'}</span>
                    </div>
                </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 italic text-center">* Recuerda presionar "Guardar Cambios ➔" al final de la página si hiciste alguna modificación.</p>
        </div>
    );
};

export default VisualAcuityTab;
