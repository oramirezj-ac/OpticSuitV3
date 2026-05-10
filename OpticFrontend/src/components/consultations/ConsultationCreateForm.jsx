import React from 'react';

const ConsultationCreateForm = ({
    form, handleFormChange, tipoConsulta, setTipoConsulta, params,
    pharmacyCatalog, selectedProducts, toggleProduct
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group mb-4">
                <label>Fecha de Consulta</label>
                <input type="date" name="fecha" className="form-input" value={form.fecha} onChange={handleFormChange} required />
            </div>

            {!params?.type && (
                <div className="form-group mb-4">
                    <label>Tipo de Consulta</label>
                    <select className="form-input" value={tipoConsulta} onChange={(e) => setTipoConsulta(e.target.value)}>
                        <option value="consulta_lentes">Consulta por Lentes (Refractiva)</option>
                        <option value="consulta_medica">Consulta Médica</option>
                    </select>
                </div>
            )}

            <div className="form-group mb-4">
                <label>Motivo de Consulta</label>
                <input type="text" name="motivoConsulta" className="form-input" value={form.motivoConsulta} onChange={handleFormChange} required />
            </div>

            <div className="form-group mb-4">
                <label>Costo de Consulta / Servicio ($)</label>
                <div className="flex gap-2">
                    <input type="number" name="costoServicio" className="form-input flex-1" value={form.costoServicio} onChange={handleFormChange} onWheel={(e) => e.target.blur()} />
                    {tipoConsulta === 'consulta_medica' ? (
                        <>
                            <button type="button" className="btn-action-small" onClick={() => handleFormChange({ target: { name: 'costoServicio', value: 0 } })}>Cortesía</button>
                            <button type="button" className="btn-action-small" onClick={() => handleFormChange({ target: { name: 'costoServicio', value: 0 } })}>Seguimiento</button>
                        </>
                    ) : (
                        <button type="button" className="btn-action-small" onClick={() => handleFormChange({ target: { name: 'costoServicio', value: 300 } })}>Solo Graduación ($300)</button>
                    )}
                </div>
            </div>

            {tipoConsulta === 'consulta_medica' && (
                <>
                    <div className="form-group md:col-span-2 mb-4">
                        <label className="mb-3 block font-bold text-slate-700">Productos de Farmacia (Tratamiento Sugerido)</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {pharmacyCatalog.map(prod => (
                                <div 
                                    key={prod.id} 
                                    className={`pharmacy-card p-3 border rounded-lg cursor-pointer transition-all ${selectedProducts.find(p => p.id === prod.id) ? 'active' : ''}`}
                                    onClick={() => toggleProduct(prod)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-bold text-blue-600 uppercase">{prod.reason}</span>
                                        <div className={`check-pill ${selectedProducts.find(p => p.id === prod.id) ? 'show' : ''}`}>✓</div>
                                    </div>
                                    <div className="font-bold text-slate-800">{prod.name}</div>
                                    <div className="text-sm text-slate-500 font-bold">${prod.price}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-group md:col-span-2 mb-4">
                        <label>Diagnóstico</label>
                        <input type="text" name="diagnostico" className="form-input" value={form.diagnostico} onChange={handleFormChange} placeholder="Ej. Conjuntivitis, Blefaritis..." required />
                    </div>
                    <div className="form-group md:col-span-2 mb-4">
                        <label>Tratamiento / Receta</label>
                        <textarea name="tratamiento" className="form-input" rows="3" value={form.tratamiento} onChange={handleFormChange} required />
                    </div>
                </>
            )}

            <div className="form-group md:col-span-2 mb-4">
                <label>Observaciones Generales</label>
                <textarea name="observaciones" className="form-input" rows="2" value={form.observaciones} onChange={handleFormChange} />
            </div>
        </div>
    );
};

export default ConsultationCreateForm;
