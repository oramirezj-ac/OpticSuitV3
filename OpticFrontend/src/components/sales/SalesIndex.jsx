import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { formatDateLong } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatUtils';
import './SalesIndex.css';

const SalesIndex = ({ onNavigate }) => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async (search = '') => {
        setLoading(true);
        try {
            // We'll need a backend endpoint for this. Using a generic one for now.
            const url = search ? `/api/sales/search?folio=${search}` : '/api/sales/recent';
            const data = await apiClient.get(url);
            setSales(data || []);
        } catch (err) {
            console.error("Error fetching sales:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchSales(searchTerm);
    };

    return (
        <div className="sales-container animate-fade-in">
            <div className="sales-header">
                <h2><span className="icon">💰</span> Ventas e Ingresos</h2>
                <button 
                    className="btn-primary"
                    onClick={() => onNavigate('sales-create')}
                >
                    + Nueva Venta / Nota
                </button>
            </div>

            <div className="sales-filters card mb-6">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <input 
                        type="text" 
                        placeholder="Buscar por Folio Físico..." 
                        className="form-input flex-1"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="btn-secondary">Buscar</button>
                    <button 
                        type="button" 
                        className="btn-icon" 
                        onClick={() => {setSearchTerm(''); fetchSales();}}
                        title="Limpiar"
                    >
                        🔄
                    </button>
                </form>
            </div>

            {loading ? (
                <div className="loading-container"><div className="loader"></div></div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
                <div className="table-responsive card">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Folio Físico</th>
                                <th>Fecha</th>
                                <th>Paciente</th>
                                <th>Total Nota</th>
                                <th>Saldo Pendiente</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length > 0 ? (
                                sales.map(sale => (
                                    <tr key={sale.id}>
                                        <td className="font-bold">
                                            {/* Clean suffix for user display as per requirement */}
                                            {sale.folioFisico?.split('-D')[0]}
                                        </td>
                                        <td>{formatDateLong(sale.fecha)}</td>
                                        <td>
                                            {sale.consulta?.paciente 
                                                ? `${sale.consulta.paciente.nombre} ${sale.consulta.paciente.apellidoPaterno || ''}` 
                                                : 'Venta Directa'}
                                        </td>
                                        <td className="font-mono">{formatCurrency(sale.totalVenta)}</td>
                                        <td className={`font-bold ${sale.saldoPendiente > 0 ? 'text-danger' : 'text-success'}`}>
                                            {formatCurrency(sale.saldoPendiente)}
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button 
                                                    className="btn-icon" 
                                                    title="Gestionar Abonos / Pagos"
                                                    onClick={() => onNavigate('sales-details', { saleId: sale.id })}
                                                >
                                                    💳
                                                </button>
                                                <button 
                                                    className="btn-icon" 
                                                    title="Eliminar Venta"
                                                    onClick={() => onNavigate('sale-delete', { saleId: sale.id })}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center p-8 text-slate-400">
                                        No se encontraron ventas para mostrar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SalesIndex;
