import React from 'react';
import { formatDateLong } from '../../../utils/dateUtils';

const ConsultationHistory = ({ consultations, loading, onNavigate }) => {
    return (
        <div className="tab-pane">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h4>Historial de Consultas</h4>
                <button className="btn-sm btn-primary" onClick={() => onNavigate && onNavigate('historical')}>+ Nueva</button>
            </div>

            {loading ? <div className="loader-sm">Cargando...</div> : (
                consultations.length === 0 ? (
                    <div className="empty-tab">
                        <p>No hay consultas registradas.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Motivo</th>
                                    <th>Diagnóstico</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {consultations.map(c => (
                                    <tr key={c.id}>
                                        <td>{formatDateLong(c.fecha)}</td>
                                        <td>{c.motivoConsulta}</td>
                                        <td>{c.diagnostico || '-'}</td>
                                        <td>
                                            <button className="btn-sm btn-outline">Ver Detalles</button>
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
