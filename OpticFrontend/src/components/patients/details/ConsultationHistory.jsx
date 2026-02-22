import React from 'react';
import { formatDateLong } from '../../../utils/dateUtils';

const ConsultationHistory = ({ type, consultations, loading, onNavigate, onCheckout }) => {
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold text-slate-700">
                    {type === 'medical' ? 'Historial Médico' : 'Historial de Lentes'}
                </h4>
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
                                    {type === 'medical' && <th className="p-3">Diagnóstico</th>}
                                    <th className="p-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {consultations.map(c => {
                                    let diag = '-';
                                    if (c.detallesClinicos) {
                                        try {
                                            const det = JSON.parse(c.detallesClinicos);
                                            diag = det.diagnostico || '-';
                                        } catch (e) { }
                                    }
                                    return (
                                        <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0">
                                            <td className="p-3 font-medium text-slate-700">{formatDateLong(c.fecha)}</td>
                                            <td className="p-3 text-slate-600">{c.motivoConsulta}</td>
                                            {type === 'medical' && (
                                                <td className="p-3 text-slate-500">{diag}</td>
                                            )}
                                            <td className="p-3 text-right">
                                                {type === 'medical' && (
                                                    <button
                                                        className="btn btn-primary text-xs py-1 px-3 mr-2 bg-green-600 hover:bg-green-700 text-white border-transparent"
                                                        onClick={() => onCheckout && onCheckout(c)}
                                                    >
                                                        Cobrar
                                                    </button>
                                                )}
                                                <button className="btn btn-secondary text-xs py-1 px-3">
                                                    Ver Detalles
                                                </button>
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
