import React from 'react';
import { formatDateLong } from '../../../utils/dateUtils';

const VisualAcuityHistory = ({ patientId, consultations, loading, onNavigate }) => {
    // Filtrar consultas que tengan agudeza visual
    const vaConsultations = (consultations || []).filter(c => {
        if (!c.detallesClinicos) return false;
        try {
            const dc = typeof c.detallesClinicos === 'string' ? JSON.parse(c.detallesClinicos) : c.detallesClinicos;
            return !!dc.agudezaVisual;
        } catch (e) {
            return false;
        }
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Cargando historial de agudeza visual...</div>;
    }

    if (vaConsultations.length === 0) {
        return (
            <div className="animate-fade-in p-8 text-center bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                <div className="text-4xl mb-3 opacity-50">👁️</div>
                <p className="text-slate-500 font-medium mb-2">No hay registros de Agudeza Visual para este paciente.</p>
                <p className="text-sm text-slate-400">
                    Puedes agregar agudeza visual editando cualquier consulta médica o de lentes.
                </p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <h4 className="text-lg font-semibold text-slate-700 mb-6">Historial de Agudeza Visual</h4>
            
            <div className="flex flex-col gap-6">
                {vaConsultations.map(c => {
                    const dc = typeof c.detallesClinicos === 'string' ? JSON.parse(c.detallesClinicos) : c.detallesClinicos;
                    const av = dc.agudezaVisual;

                    return (
                        <div key={c.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <span className="font-semibold text-slate-700">{formatDateLong(c.fecha)}</span>
                                    <span className="text-xs text-slate-500 ml-3 bg-slate-200 px-2 py-1 rounded">
                                        {c.tipoConsulta === 'consulta_medica' ? 'Consulta Médica' : 'Consulta por Lentes'}
                                    </span>
                                </div>
                                <button 
                                    className="btn btn-ghost text-xs border border-slate-200"
                                    onClick={() => onNavigate && onNavigate('consultation-edit', { consultationId: c.id, patientId: patientId })}
                                >
                                    ✏️ Ver / Editar
                                </button>
                            </div>
                            
                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* SC */}
                                <div className="bg-slate-50 rounded p-3 border border-slate-100">
                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Sin Corrección</h5>
                                    <div className="flex justify-between text-sm mb-1"><span className="text-slate-500">OD:</span> <span className="font-semibold">{av.sc_od || '-'}</span></div>
                                    <div className="flex justify-between text-sm mb-1"><span className="text-slate-500">OI:</span> <span className="font-semibold">{av.sc_oi || '-'}</span></div>
                                    <div className="flex justify-between text-sm font-medium border-t pt-1 mt-1"><span className="text-slate-500">AO:</span> <span>{av.sc_ao || '-'}</span></div>
                                </div>

                                {/* CC */}
                                <div className="bg-blue-50 rounded p-3 border border-blue-100">
                                    <h5 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 text-center">Con Corrección</h5>
                                    <div className="flex justify-between text-sm mb-1"><span className="text-blue-600">OD:</span> <span className="font-semibold text-blue-800">{av.cc_od || '-'}</span></div>
                                    <div className="flex justify-between text-sm mb-1"><span className="text-blue-600">OI:</span> <span className="font-semibold text-blue-800">{av.cc_oi || '-'}</span></div>
                                    <div className="flex justify-between text-sm font-medium border-t border-blue-200 pt-1 mt-1"><span className="text-blue-600">AO:</span> <span className="text-blue-800">{av.cc_ao || '-'}</span></div>
                                </div>

                                {/* CV */}
                                <div className="bg-green-50 rounded p-3 border border-green-100 flex flex-col justify-center items-center">
                                    <h5 className="text-xs font-bold text-green-500 uppercase tracking-wider mb-2">Capacidad Visual</h5>
                                    <span className="text-2xl font-bold text-green-700">{av.cv || '-'}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VisualAcuityHistory;
