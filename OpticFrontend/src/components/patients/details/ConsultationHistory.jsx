import React from 'react';
import { formatDateLong } from '../../../utils/dateUtils';

const ConsultationHistory = ({ consultations, loading, onNavigate }) => {
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold text-slate-700">Historial de Consultas</h4>
                <button 
                    className="btn btn-primary text-sm" 
                    onClick={() => onNavigate && onNavigate('historical')}
                >
                    + Nueva Consulta
                </button>
            </div>

            {loading ? <div className="p-8 text-center text-muted">Cargando historial...</div> : (
                consultations.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                        <p className="text-muted mb-2">No hay consultas registradas para este paciente.</p>
                        <button className="btn btn-ghost text-sm" onClick={() => onNavigate && onNavigate('historical')}>
                            Registrar la primera ahora
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3">Motivo</th>
                                    <th className="p-3">Diagnóstico</th>
                                    <th className="p-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {consultations.map(c => (
                                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0">
                                        <td className="p-3 font-medium text-slate-700">{formatDateLong(c.fecha)}</td>
                                        <td className="p-3 text-slate-600">{c.motivoConsulta}</td>
                                        <td className="p-3 text-slate-500">{c.diagnostico || '-'}</td>
                                        <td className="p-3 text-right">
                                            <button className="btn btn-secondary text-xs py-1 px-3">
                                                Ver Detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
    );
};

export default ConsultationHistory;
