import React from 'react';
import { formatDateLong } from '../../../utils/dateUtils';
import GraduationCard from '../../common/GraduationCard';

const ConsultationHistory = ({ type, patientId, consultations, loading, onNavigate, onCheckout, onDelete, onCreateConsultation, onManageVisualAcuity }) => {
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold text-slate-700">
                    {type === 'medical' ? 'Historial Médico' : 'Historial de Lentes'}
                </h4>
                <button
                    className="btn btn-primary text-sm"
                    onClick={() => onCreateConsultation && onCreateConsultation()}
                >
                    + Nueva Consulta
                </button>
            </div>

            {loading ? <div className="p-8 text-center text-muted">Cargando historial...</div> : (
                consultations.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                        <p className="text-muted mb-2">No hay consultas registradas para este paciente.</p>
                        <button className="btn btn-ghost text-sm" onClick={() => onCreateConsultation && onCreateConsultation()}>
                            Registrar la primera ahora
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3">Motivo / Especialidad</th>
                                    <th className="p-3">Lecturas Clínicas</th>
                                    <th className="p-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {consultations.map(c => {
                                    let diag = '-';
                                    let hasVA = false;
                                    let avData = null;
                                    if (c.detallesClinicos) {
                                        try {
                                            const det = typeof c.detallesClinicos === 'string' ? JSON.parse(c.detallesClinicos) : c.detallesClinicos;
                                            diag = det.diagnostico || '-';
                                            hasVA = !!det.agudezaVisual;
                                            avData = det.agudezaVisual;
                                        } catch (e) { }
                                    }
                                    return (
                                        <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0">
                                            <td className="p-3">
                                                <div className="font-medium text-slate-700">{formatDateLong(c.fecha)}</div>
                                                <div className="text-xs text-slate-400">ID: {c.id.substring(0, 8)}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="text-slate-600 font-bold flex items-center gap-2">
                                                    {c.motivoConsulta}
                                                    {hasVA && <span title="Agudeza Visual Registrada" className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">👁️ AV</span>}
                                                </div>
                                                {type === 'medical' && <div className="text-xs text-blue-500 italic mt-1">Diag: {diag}</div>}
                                            </td>
                                            <td className="p-3">
                                                {(() => {
                                                    const finalGrads = (c.graduaciones || []).filter(g =>
                                                        (g.tipoGraduacion || '').toLowerCase() === 'final'
                                                    );
                                                    return (
                                                        <div className="flex flex-col gap-3">
                                                            {finalGrads.length > 0 ? (
                                                                <div className="flex flex-col gap-2">
                                                                    {finalGrads.map((g) => (
                                                                        <GraduationCard
                                                                            key={g.id}
                                                                            graduation={g}
                                                                            title="Grad. Final"
                                                                        />
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-300 italic text-xs">Sin graduación final</span>
                                                            )}
                                                            
                                                            {hasVA && avData && (
                                                                <div className="bg-blue-50 border border-blue-100 rounded p-2 mt-1">
                                                                    <div className="text-[10px] font-bold text-blue-500 uppercase mb-1 flex items-center justify-between">
                                                                        <span>👁️ Agudeza Visual</span>
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-600 flex items-center justify-between gap-2">
                                                                        <div><span className="font-medium text-slate-400">SC AO:</span> <span className="font-semibold">{avData.sc_ao || '-'}</span></div>
                                                                        <div><span className="font-medium text-slate-400">CC AO:</span> <span className="font-semibold text-blue-800">{avData.cc_ao || '-'}</span></div>
                                                                        <div><span className="font-medium text-slate-400">CV:</span> <span className="font-bold text-green-700">{avData.cv || '-'}</span></div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {type === 'medical' && (
                                                        <button
                                                            className="btn btn-primary text-xs py-1 px-3 bg-green-600 hover:bg-green-700 text-white border-transparent"
                                                            onClick={() => onCheckout && onCheckout(c)}
                                                        >
                                                            Cobrar
                                                        </button>
                                                    )}
                                                    {type === 'lenses' && (
                                                        <button
                                                            className="btn btn-primary text-xs py-1 px-3"
                                                            style={{ background: '#0369a1', borderColor: '#0369a1' }}
                                                            onClick={() => onNavigate && onNavigate('consultation-graduations', {
                                                                consultationId: c.id,
                                                                patientId: c.pacienteId
                                                            })}
                                                        >
                                                            👓 Graduaciones
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-ghost text-xs border border-slate-200"
                                                        onClick={() => onNavigate && onNavigate('consultation-edit', { consultationId: c.id, patientId: c.pacienteId })}
                                                    >
                                                        ✏️ Ver/Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost text-xs py-1 px-3 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                                        onClick={() => {
                                                            if (typeof onManageVisualAcuity === 'function') {
                                                                onManageVisualAcuity(c);
                                                            }
                                                        }}
                                                    >
                                                        👁️ Agudeza Visual
                                                    </button>
                                                    {onDelete && (
                                                        <button
                                                            className="btn text-xs py-1 px-3"
                                                            style={{ background: '#fee2e2', color: '#b91c1c', border: 'none' }}
                                                            onClick={() => onDelete(c.id)}
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
    );
};

export default ConsultationHistory;
