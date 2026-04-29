import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { authService } from '../../services/authService';
import { formatDateLong } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatUtils';
import './SalesIndex.css';

const SalesIndex = ({ onNavigate }) => {
    // --- States ---
    const [activeTab, setActiveTab] = useState('notas'); // 'notas' | 'mostrador' | 'consultas'
    const [sales, setSales] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Range Filter State
    const [startFolio, setStartFolio] = useState('');
    const [endFolio, setEndFolio] = useState('');
    
    // Modals
    const [showCounterModal, setShowCounterModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);

    // --- Effects ---
    useEffect(() => {
        fetchYears();
    }, []);

    useEffect(() => {
        if (activeTab === 'notas') {
            fetchSalesByYear(selectedYear);
        } else if (activeTab === 'mostrador') {
            fetchCounterSales();
        } else if (activeTab === 'consultations') {
            fetchConsultationSales();
        } else if (activeTab === 'descending') {
            fetchDescendingSales();
        } else if (activeTab === 'range') {
            if (startFolio && endFolio) fetchRangeSales(startFolio, endFolio);
            else setSales([]);
        }
    }, [activeTab, selectedYear]);

    // --- Fetching Logic ---
    const fetchYears = async () => {
        try {
            const years = await apiClient.get('/api/sales/years');
            setAvailableYears(years || [new Date().getFullYear()]);
            if (years && years.length > 0 && !years.includes(selectedYear)) {
                setSelectedYear(years[0]);
            }
        } catch (err) {
            console.error("Error fetching years:", err);
        }
    };

    const fetchSalesByYear = async (year) => {
        setLoading(true);
        try {
            const data = await apiClient.get(`/api/sales/year/${year}`);
            setSales(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCounterSales = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get('/api/sales/counter');
            setSales(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchConsultationSales = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get('/api/sales/consultations');
            setSales(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchDescendingSales = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get('/api/sales/descending');
            setSales(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchRangeSales = async (start, end) => {
        setLoading(true);
        try {
            const data = await apiClient.get(`/api/sales/range?start=${start}&end=${end}`);
            setSales(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm) {
            if (activeTab === 'notas') fetchSalesByYear(selectedYear);
            else if (activeTab === 'mostrador') fetchCounterSales();
            else if (activeTab === 'descending') fetchDescendingSales();
            else if (activeTab === 'range') {
                if (startFolio && endFolio) fetchRangeSales(startFolio, endFolio);
                else setSales([]);
            }
            else fetchConsultationSales();
            return;
        }
        setLoading(true);
        try {
            const data = await apiClient.get(`/api/sales/search?folio=${searchTerm}`);
            setSales(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Action Handlers ---
    const handleAddCounterSale = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        const formData = new FormData(e.target);
        const payload = {
            concept: formData.get('concept'),
            amount: parseFloat(formData.get('amount')),
            date: formData.get('date'),
            userId: authService.getUserId()
        };

        try {
            await apiClient.post('/api/sales/counter', payload);
            setShowCounterModal(false);
            if (activeTab === 'mostrador') fetchCounterSales();
        } catch (err) {
            setError("Error al registrar venta: " + err.message);
        } finally {
            setModalLoading(false);
        }
    };

    const handleRegisterCancelled = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        const formData = new FormData(e.target);
        const payload = {
            folio: formData.get('folio'),
            date: formData.get('date'),
            userId: authService.getUserId()
        };

        try {
            await apiClient.post('/api/sales/cancel-folio', payload);
            setShowCancelModal(false);
            if (activeTab === 'notas') fetchSalesByYear(selectedYear);
        } catch (err) {
            setError("Error al registrar folio: " + err.message);
        } finally {
            setModalLoading(false);
        }
    };

    // --- Helpers ---
    const isFolioValid = (folio) => {
        if (!folio) return true;
        // Solo para tab de notas validamos que sea numérico de 4 dígitos
        if (activeTab !== 'notas') return true; 
        const base = folio.split('-D')[0];
        return base.length === 4 && !isNaN(base);
    };

    const getFolioLabel = (sale) => {
        if (sale.folioFisico?.startsWith('VM-')) return 'MOSTRADOR';
        if (sale.folioFisico?.startsWith('MED-')) return 'C. MÉDICA';
        if (sale.folioFisico?.startsWith('CL-')) return 'GRADUACIÓN';
        return sale.folioFisico;
    };

    // --- Render Components ---
    return (
        <div className="sales-container animate-fade-in">
            <div className="sales-header">
                <h2><span className="icon">💰</span> Ventas e Ingresos</h2>
                <div className="flex gap-2">
                    <button className="btn-secondary" onClick={() => setShowCancelModal(true)}>
                        🚫 Folio Cancelado
                    </button>
                    <button className="btn-primary" onClick={() => setShowCounterModal(true)}>
                        ⚡ Venta Mostrador
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="sales-tabs flex-wrap">
                <button 
                    className={`tab-btn ${activeTab === 'notas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notas')}
                >
                    Notas de Venta
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'descending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('descending')}
                >
                    Descendente
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'range' ? 'active' : ''}`}
                    onClick={() => setActiveTab('range')}
                >
                    Rango de Folios
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'mostrador' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mostrador')}
                >
                    Mostrador
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'consultations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('consultations')}
                >
                    Consultas
                </button>
            </div>

            {/* Year Selector (Only for Notas) */}
            {activeTab === 'notas' && (
                <div className="year-selector">
                    {availableYears.map(year => (
                        <button 
                            key={year}
                            className={`year-btn ${selectedYear === year ? 'active' : ''}`}
                            onClick={() => setSelectedYear(year)}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            )}

            {/* Search Filter */}
            {activeTab !== 'range' && (
                <div className="sales-filters card mb-6">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <input 
                            type="text" 
                            placeholder="Buscar folio en toda la categoría..." 
                            className="form-input flex-1"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit" className="btn-secondary">Buscar</button>
                        <button 
                            type="button" 
                            className="btn-icon" 
                            onClick={() => {
                                setSearchTerm(''); 
                                if (activeTab === 'notas') fetchSalesByYear(selectedYear);
                                else if (activeTab === 'mostrador') fetchCounterSales();
                                else if (activeTab === 'descending') fetchDescendingSales();
                                else fetchConsultationSales();
                            }}
                            title="Limpiar"
                        >
                            🔄
                        </button>
                    </form>
                </div>
            )}

            {/* Range Filter */}
            {activeTab === 'range' && (
                <div className="sales-filters card mb-6">
                    <form onSubmit={(e) => { e.preventDefault(); fetchRangeSales(startFolio, endFolio); }} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm text-slate-500 mb-1">Folio Inicial (ej. 0001)</label>
                            <input 
                                type="text" 
                                className="form-input w-full"
                                value={startFolio}
                                onChange={(e) => setStartFolio(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm text-slate-500 mb-1">Folio Final (ej. 0100)</label>
                            <input 
                                type="text" 
                                className="form-input w-full"
                                value={endFolio}
                                onChange={(e) => setEndFolio(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Filtrar</button>
                        <button 
                            type="button" 
                            className="btn-icon" 
                            onClick={() => {
                                setStartFolio(''); 
                                setEndFolio('');
                                setSales([]);
                            }}
                            title="Limpiar"
                        >
                            🔄
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="loading-container"><div className="loader"></div></div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
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
            )}

            {/* --- Modals --- */}
            
            {showCounterModal && (
                <div className="sales-modal-overlay">
                    <div className="sales-modal">
                        <h3>⚡ Nueva Venta Mostrador</h3>
                        <p className="mb-4 text-sm text-slate-400">Captura rápida de ventas diarias (libre de pacientes).</p>
                        <form onSubmit={handleAddCounterSale}>
                            <div className="form-group">
                                <label>Concepto / Productos</label>
                                <input name="concept" className="form-input" placeholder="Ej. Solución 500ml y Estuche" required />
                            </div>
                            <div className="form-group">
                                <label>Monto Total ($)</label>
                                <input name="amount" type="number" step="0.01" className="form-input" placeholder="0.00" required />
                            </div>
                            <div className="form-group">
                                <label>Fecha de Venta</label>
                                <input name="date" type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} required />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowCounterModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={modalLoading}>
                                    {modalLoading ? 'Guardando...' : 'Guardar en Mostrador'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCancelModal && (
                <div className="sales-modal-overlay">
                    <div className="sales-modal">
                        <h3 className="text-danger">🚫 Registrar Folio Cancelado</h3>
                        <p className="mb-4 text-sm text-slate-400">Registra folios físicos que fueron anulados o dañados.</p>
                        <form onSubmit={handleRegisterCancelled}>
                            <div className="form-group">
                                <label>Número de Folio</label>
                                <input name="folio" className="form-input" placeholder="Ej. 0101" required />
                            </div>
                            <div className="form-group">
                                <label>Fecha de Cancelación</label>
                                <input name="date" type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} required />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowCancelModal(false)}>Cerrar</button>
                                <button type="submit" className="btn-primary" disabled={modalLoading}>
                                    {modalLoading ? 'Registrando...' : 'Confirmar Cancelación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesIndex;
