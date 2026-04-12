import React from 'react';
import { formatDateLong } from '../../../utils/dateUtils';
import GraduationCard from '../../common/GraduationCard';

const ConsultationHistory = ({ type, consultations, loading, onNavigate, onCheckout, onDelete }) => {
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
                                    <th className="p-3">Motivo / Especialidad</th>
                                    <th className="p-3">Lecturas (Graduaciones)</th>
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
                                            <td className="p-3">
                                                <div className="font-medium text-slate-700">{formatDateLong(c.fecha)}</div>
                                                <div className="text-xs text-slate-400">ID: {c.id.substring(0,8)}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="text-slate-600 font-bold">{c.motivoConsulta}</div>
                                                {type === 'medical' && <div className="text-xs text-blue-500 italic">Diag: {diag}</div>}
                                            </td>
                                            <td className="p-3">
                                                {c.graduaciones && c.graduaciones.length > 0 ? (
                                                    <div className="flex flex-col gap-4">
                                                        {c.graduaciones.map((g) => (
                                                            <GraduationCard 
                                                                key={g.id} 
                                                                graduation={g} 
                                                                title={g.tipoGraduacion || 'Lectura'}
                                                            />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 italic text-xs">Sin graduaciones</span>
                                                )}
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
                                                    <button 
                                                        className="btn btn-ghost text-xs border border-slate-200"
                                                        onClick={() => onNavigate && onNavigate('consultation-edit', { consultationId: c.id, patientId: c.pacienteId })}
                                                    >
                                                        ✏️ Ver/Edit
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
