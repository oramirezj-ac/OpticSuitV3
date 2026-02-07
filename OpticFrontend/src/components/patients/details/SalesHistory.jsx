import React from 'react';
import { formatDateLong } from '../../../utils/dateUtils';
import { formatCurrency } from '../../../utils/formatUtils';

const SalesHistory = ({ sales, loading, onNavigate, onSelectSale }) => {
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold text-slate-700">Historial de Ventas</h4>
                <button
                    className="btn btn-primary text-sm"
                    onClick={() => onNavigate && onNavigate('historical')}
                >
                    + Nueva Venta
                </button>
            </div>

            {loading ? <div className="p-8 text-center text-muted">Cargando historial...</div> : (
                sales.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                        <p className="text-muted mb-2">No hay ventas registradas.</p>
                        <button className="btn btn-ghost text-sm" onClick={() => onNavigate && onNavigate('historical')}>
                            Realizar una venta
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Folio</th>
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3">Total</th>
                                    <th className="p-3">Saldo</th>
                                    <th className="p-3">Estatus</th>
                                    <th className="p-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map(s => {
                                    const isPaid = s.saldoPendiente <= 0.1;
                                    return (
                                        <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0">
                                            <td className="p-3 font-mono text-slate-600">{s.folioFisico || 'S/F'}</td>
                                            <td className="p-3 text-slate-700">{formatDateLong(s.fecha)}</td>
                                            <td className="p-3 font-medium text-slate-800">{formatCurrency(s.totalVenta)}</td>
                                            <td className={`p-3 font-bold ${isPaid ? 'text-success' : 'text-danger'}`}>
                                                {formatCurrency(s.saldoPendiente)}
                                            </td>
                                            <td className="p-3">
                                                <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                                                    {isPaid ? 'PAGADO' : 'PENDIENTE'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button
                                                    className="btn btn-secondary text-xs py-1 px-3"
                                                    onClick={() => onSelectSale(s)}
                                                >
                                                    Ver Nota
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

export default SalesHistory;
