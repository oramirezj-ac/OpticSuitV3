import React from 'react';
import { formatDateLong } from '../../utils/dateUtils';
import { formatCurrency, formatFolioDisplay } from '../../utils/formatUtils';

const SalesIndexTable = ({ sales, activeTab, onNavigate }) => {

    const isFolioValid = (folio) => {
        if (!folio) return true;
        // Solo para tab de notas validamos que sea numérico de 4 dígitos
        if (activeTab !== 'notas') return true; 
        const base = formatFolioDisplay(folio);
        return base.length === 4 && !isNaN(base);
    };

    const getFolioLabel = (sale) => {
        if (sale.folioFisico?.startsWith('VM-')) return 'MOSTRADOR';
        if (sale.folioFisico?.startsWith('MED-')) return 'C. MÉDICA';
        if (sale.folioFisico?.startsWith('CL-')) return 'GRADUACIÓN';
        return formatFolioDisplay(sale.folioFisico);
    };

    return (
        <div className="table-responsive card">
            <table className="modern-table">
                <thead>
                    <tr>
                        <th>Folio</th>
                        <th>Fecha</th>
                        <th>{activeTab === 'mostrador' ? 'Concepto' : 'Paciente / Motivo'}</th>
                        <th>Total</th>
                        {activeTab !== 'mostrador' && activeTab !== 'descending' && activeTab !== 'range' && <th>Saldo</th>}
                        {activeTab !== 'descending' && activeTab !== 'range' && <th>Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {sales.length > 0 ? (
                        sales.map(sale => (
                            <tr key={sale.id} className={sale.estado === 'Cancelada' ? 'opacity-60' : ''}>
                                <td>
                                    <div className="flex flex-col">
                                        <span className={`font-bold ${activeTab === 'consultations' ? 'text-xs text-blue-600' : ''}`}>
                                            {getFolioLabel(sale)}
                                        </span>
                                        {activeTab === 'notas' && !isFolioValid(sale.folioFisico) && (
                                            <span className="folio-warning">⚠️ No tiene 4 dígitos</span>
                                        )}
                                    </div>
                                </td>
                                <td>{formatDateLong(sale.fecha)}</td>
                                <td>
                                    {sale.estado === 'Cancelada' ? (
                                        <span className="status-cancelled">Nota Cancelada</span>
                                    ) : (
                                        <>
                                            {activeTab === 'mostrador' ? (
                                                <span className="font-medium">{sale.observacionesGenerales}</span>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="font-bold">
                                                        {sale.paciente 
                                                            ? `${sale.paciente.nombre} ${sale.paciente.apellidoPaterno || ''}` 
                                                            : (sale.consulta?.paciente 
                                                                ? `${sale.consulta.paciente.nombre} ${sale.consulta.paciente.apellidoPaterno || ''}` 
                                                                : 'Venta Directa')}
                                                    </span>
                                                    {activeTab === 'consultations' && sale.consulta && (
                                                        <span className="text-xs text-slate-500 italic">
                                                            {sale.consulta.motivoConsulta}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </td>
                                <td className="font-mono">{formatCurrency(sale.totalVenta)}</td>
                                {activeTab !== 'mostrador' && activeTab !== 'descending' && activeTab !== 'range' && (
                                    <td className={`font-bold ${sale.saldoPendiente > 0 ? 'text-danger' : 'text-success'}`}>
                                        {formatCurrency(sale.saldoPendiente)}
                                    </td>
                                )}
                                {activeTab !== 'descending' && activeTab !== 'range' && (
                                    <td>
                                        <div className="flex gap-2">
                                            {sale.estado !== 'Cancelada' && (
                                                <button 
                                                    className="btn-icon" 
                                                    title="Gestionar Abonos / Pagos"
                                                    onClick={() => onNavigate('sales-details', { saleId: sale.id })}
                                                >
                                                    💳
                                                </button>
                                            )}
                                            <button 
                                                className="btn-icon" 
                                                title="Eliminar"
                                                onClick={() => onNavigate('sale-delete', { saleId: sale.id })}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="text-center p-8 text-slate-400">
                                No se encontraron registros.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default SalesIndexTable;
