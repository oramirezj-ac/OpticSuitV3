import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { authService } from '../../services/authService';
import { formatCurrency } from '../../utils/formatUtils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import './Dashboard.css';

// Helper: Format a long date in Spanish
const formatLongDate = (date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
};

// Shared chart renderer to avoid duplication
const MonthlyChart = ({ chartData, activeTab }) => (
    <div style={{ width: '100%', height: 360 }}>
        <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(val) => `$${val.toLocaleString()}`}
                    width={70}
                />
                <Tooltip 
                    cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div style={{
                                    background: '#0f172a',
                                    color: 'white',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                                    border: 'none'
                                }}>
                                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {payload[0].payload.fullName}
                                    </p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>
                                        {formatCurrency(payload[0].value)}
                                    </p>
                                </div>
                            );
                        }
                        return null;
                    }}
                />
                <Bar 
                    dataKey="total" 
                    radius={[8, 8, 0, 0]}
                    barSize={36}
                >
                    {chartData.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={activeTab === 'lentes' ? '#6366f1' : '#10b981'} 
                            fillOpacity={0.7 + (index / chartData.length) * 0.3}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
);

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('lentes');
    const [selectedYear, setSelectedYear] = useState(null);

    // Root-only state
    const isRoot = authService.getUserRoles().includes('Root');
    const [tenants, setTenants] = useState([]);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [tenantTab, setTenantTab] = useState('lentes');
    const [tenantYear, setTenantYear] = useState(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await apiClient.get('/api/reporting/admin-summary');
                setData(response);
                
                if (response.ventasLentes && response.ventasLentes.length > 0) {
                    setSelectedYear(response.ventasLentes[0].anio);
                }
            } catch (err) {
                console.error("Error fetching admin dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();

        // Root: fetch cross-tenant data
        if (isRoot) {
            const fetchTenants = async () => {
                try {
                    const response = await apiClient.get('/api/reporting/root-summary');
                    setTenants(response);
                } catch (err) {
                    console.error("Error fetching root summary:", err);
                }
            };
            fetchTenants();
        }
    }, []);

    const currentReportList = activeTab === 'lentes' ? data?.ventasLentes : data?.ventasMedicas;
    const activeYearData = currentReportList?.find(y => y.anio === selectedYear);

    const chartData = activeYearData?.meses.map(m => ({
        name: m.nombreMes.substring(0, 3).toUpperCase(),
        total: m.totalMensual,
        fullName: m.nombreMes
    })) || [];

    // Root: tenant drill-down data
    const selectedTenantData = tenants.find(t => t.schema === selectedTenant);
    const tenantReportList = tenantTab === 'lentes' ? selectedTenantData?.ventasLentes : selectedTenantData?.ventasMedicas;
    const tenantYearData = tenantReportList?.find(y => y.anio === tenantYear);
    const tenantChartData = tenantYearData?.meses.map(m => ({
        name: m.nombreMes.substring(0, 3).toUpperCase(),
        total: m.totalMensual,
        fullName: m.nombreMes
    })) || [];

    const handleSelectTenant = (schema) => {
        if (selectedTenant === schema) {
            setSelectedTenant(null);
            return;
        }
        setSelectedTenant(schema);
        setTenantTab('lentes');
        const tenant = tenants.find(t => t.schema === schema);
        const firstYear = tenant?.ventasLentes?.[0]?.anio || tenant?.ventasMedicas?.[0]?.anio || null;
        setTenantYear(firstYear);
    };

    if (loading) return <div className="dashboard-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 600 }}>Cargando inteligencia de negocio...</div>;

    return (
        <div className="dashboard-wrapper animate-fade-in">
            {/* ═══ HERO BANNER ═══ */}
            <div className="dashboard-hero">
                <div className="hero-top-row">
                    <div className="hero-title">
                        <h1>Panel de Control</h1>
                        <p>Resumen inteligente de ingresos globales</p>
                        <div className="dashboard-date">{formatLongDate(new Date())}</div>
                    </div>
                    <div className="dashboard-tabs">
                        <button 
                            className={`dashboard-tab ${activeTab === 'lentes' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('lentes');
                                if (data?.ventasLentes?.length > 0) setSelectedYear(data.ventasLentes[0].anio);
                            }}
                        >
                            👓 Lentes & Notas
                        </button>
                        <button 
                            className={`dashboard-tab medical ${activeTab === 'medico' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('medico');
                                if (data?.ventasMedicas?.length > 0) setSelectedYear(data.ventasMedicas[0].anio);
                            }}
                        >
                            🩺 Médico & Farmacia
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══ CONTENT ═══ */}
            <div className="dashboard-content">

                {/* Metric Cards: Global + Year cards */}
                <div className="metrics-grid">
                    <div className="global-card">
                        <span className="metric-label">Ingresos Globales Históricos</span>
                        <div className="amount-label">{formatCurrency(data?.totalGlobal || 0)}</div>
                        <span className="metric-sub">Todas las categorías combinadas</span>
                    </div>

                    {currentReportList?.map(year => (
                        <div 
                            key={year.anio} 
                            className={`year-card ${selectedYear === year.anio ? 'active' : ''}`}
                            onClick={() => setSelectedYear(year.anio)}
                        >
                            <span className="year-label">{year.anio}</span>
                            <div className="amount-label">{formatCurrency(year.totalAnual)}</div>
                            <div className="year-meta">
                                {year.meses.length} {year.meses.length === 1 ? 'mes registrado' : 'meses registrados'}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Monthly Chart Drill-down */}
                {activeYearData && (
                    <div className="chart-container">
                        <div className="chart-header">
                            <h3>Desglose Mensual — {selectedYear}</h3>
                            <span className="chart-badge">
                                Total: {formatCurrency(activeYearData.totalAnual)}
                            </span>
                        </div>
                        <MonthlyChart chartData={chartData} activeTab={activeTab} />
                    </div>
                )}

                {!activeYearData && currentReportList?.length > 0 && (
                    <div className="empty-state">
                        Seleccione un año para ver el reporte detallado
                    </div>
                )}

                {/* ═══ ROOT: MULTI-ÓPTICA SECTION ═══ */}
                {isRoot && tenants.length > 0 && (
                    <>
                        <div className="section-divider">
                            <h2>🏢 Red de Ópticas</h2>
                        </div>

                        <div className="tenant-grid">
                            {tenants.map(tenant => (
                                <div 
                                    key={tenant.schema}
                                    className={`tenant-card ${selectedTenant === tenant.schema ? 'active' : ''}`}
                                    onClick={() => handleSelectTenant(tenant.schema)}
                                >
                                    <div className="tenant-name">{tenant.nombreOptica}</div>
                                    <div className="tenant-schema">{tenant.schema}</div>
                                    <div className="tenant-total">{formatCurrency(tenant.totalGlobal)}</div>
                                    <div className="tenant-total-label">Ingresos totales</div>
                                </div>
                            ))}
                        </div>

                        {/* Tenant Drill-down */}
                        {selectedTenantData && (
                            <div className="tenant-drilldown animate-fade-in">
                                <div className="chart-container" style={{ marginBottom: '1rem' }}>
                                    <div className="chart-header">
                                        <h3>{selectedTenantData.nombreOptica} — Reporte Detallado</h3>
                                        <div className="dashboard-tabs">
                                            <button 
                                                className={`dashboard-tab ${tenantTab === 'lentes' ? 'active' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTenantTab('lentes');
                                                    const first = selectedTenantData.ventasLentes?.[0]?.anio;
                                                    if (first) setTenantYear(first);
                                                }}
                                            >
                                                👓 Lentes
                                            </button>
                                            <button 
                                                className={`dashboard-tab medical ${tenantTab === 'medico' ? 'active' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTenantTab('medico');
                                                    const first = selectedTenantData.ventasMedicas?.[0]?.anio;
                                                    if (first) setTenantYear(first);
                                                }}
                                            >
                                                🩺 Médico
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tenant year cards */}
                                    <div className="metrics-grid" style={{ marginBottom: '1.5rem' }}>
                                        {tenantReportList?.map(year => (
                                            <div 
                                                key={year.anio} 
                                                className={`year-card ${tenantYear === year.anio ? 'active' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); setTenantYear(year.anio); }}
                                            >
                                                <span className="year-label">{year.anio}</span>
                                                <div className="amount-label">{formatCurrency(year.totalAnual)}</div>
                                                <div className="year-meta">
                                                    {year.meses.length} {year.meses.length === 1 ? 'mes' : 'meses'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tenant monthly chart */}
                                    {tenantYearData && (
                                        <>
                                            <div className="chart-header" style={{ marginTop: '0.5rem' }}>
                                                <h3 style={{ fontSize: '1rem' }}>Desglose Mensual — {tenantYear}</h3>
                                                <span className="chart-badge">
                                                    Total: {formatCurrency(tenantYearData.totalAnual)}
                                                </span>
                                            </div>
                                            <MonthlyChart chartData={tenantChartData} activeTab={tenantTab} />
                                        </>
                                    )}

                                    {!tenantYearData && tenantReportList?.length > 0 && (
                                        <div className="empty-state">
                                            Seleccione un año para ver el desglose
                                        </div>
                                    )}

                                    {(!tenantReportList || tenantReportList.length === 0) && (
                                        <div className="empty-state">
                                            Sin datos de {tenantTab === 'lentes' ? 'Lentes & Notas' : 'Médico & Farmacia'} para esta óptica
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
