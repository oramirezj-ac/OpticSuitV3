import React from 'react';
import { formatDateLong } from '../../../utils/dateUtils';

const SalesHistory = ({ sales, loading, onNavigate, onSelectSale }) => {
    return (
        <div className="tab-pane">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h4>Historial de Ventas</h4>
                <button className="btn-sm btn-primary" onClick={() => onNavigate && onNavigate('historical')}>+ Nueva</button>
            </div>

            {loading ? <div className="loader-sm">Cargando...</div> : (
                sales.length === 0 ? (
                    <div className="empty-tab">
                        <p>No hay ventas registradas.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Folio</th>
                                    <th>Fecha</th>
                                    <th>Total</th>
                                    <th>Saldo</th>
                                    <th>Estatus</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map(s => (
                                    <tr key={s.id}>
                                        <td>{s.folioFisico || 'S/F'}</td>
                                        <td>{formatDateLong(s.fecha)}</td>
                                        <td>${s.totalVenta?.toFixed(2)}</td>
                                        <td style={{ color: s.saldoPendiente > 0.1 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                            ${s.saldoPendiente?.toFixed(2)}
                                        </td>
                                        <td>
                                            <span className={`badge ${s.saldoPendiente <= 0.1 ? 'badge-success' : 'badge-warning'}`}
                                                style={{ backgroundColor: s.saldoPendiente <= 0.1 ? '#dcfce7' : '#fef9c3', color: s.saldoPendiente <= 0.1 ? '#166534' : '#854d0e', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85em' }}>
                                                {s.saldoPendiente <= 0.1 ? 'PAGADO' : 'PENDIENTE'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn-sm btn-outline-primary" onClick={() => onSelectSale(s)}>Ver Nota</button>
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

export default SalesHistory;
