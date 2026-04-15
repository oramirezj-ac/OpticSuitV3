import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
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

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('lentes'); // 'lentes' or 'medico'
    const [selectedYear, setSelectedYear] = useState(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await apiClient.get('/api/reporting/admin-summary');
                setData(response);
                
                // Default to most recent year for Lentes
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
    }, []);

    const currentReportList = activeTab === 'lentes' ? data?.ventasLentes : data?.ventasMedicas;
    const activeYearData = currentReportList?.find(y => y.anio === selectedYear);

    // Prepare data for the chart
    const chartData = activeYearData?.meses.map(m => ({
        name: m.nombreMes.substring(0, 3).toUpperCase(),
        total: m.totalMensual,
        fullName: m.nombreMes
    })) || [];

    if (loading) return <div className="dashboard-wrapper">Cargando inteligencia de negocio...</div>;

    return (
        <div className="dashboard-wrapper animate-fade-in">
            <header className="dashboard-header">
                <div>
                    <h1>Panel de Control</h1>
                    <p className="text-slate-500">Resumen inteligente de ingresos globales</p>
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
            </header>

            {/* Global Total Card */}
            <div className="summary-grid">
                <div className="global-card">
                    <span className="text-slate-300 uppercase tracking-widest font-bold text-xs mb-2">Ingresos Globales Históricos</span>
                    <div className="amount-label">{formatCurrency(data?.totalGlobal || 0)}</div>
                </div>

                {/* Yearly Cards */}
                {currentReportList?.map(year => (
                    <div 
                        key={year.anio} 
                        className={`year-card ${selectedYear === year.anio ? 'active' : ''}`}
                        onClick={() => setSelectedYear(year.anio)}
                    >
                        <span className="year-label">{year.anio}</span>
                        <div className="amount-label">{formatCurrency(year.totalAnual)}</div>
                        <div className="text-xs text-slate-400 mt-2">
                            {year.meses.length} meses registrados
                        </div>
                    </div>
                ))}
            </div>

            {/* Drill-down Monthly Report */}
            {activeYearData && (
                <div className="chart-container animate-fade-in">
                    <div className="chart-header">
                        <h3>Desglose Mensual - {selectedYear}</h3>
                        <span className="px-3 py-1 bg-slate-100 rounded-full text-sm font-semibold text-slate-600">
                            Total: {formatCurrency(activeYearData.totalAnual)}
                        </span>
                    </div>
                    
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border-none">
                                                    <p className="text-xs text-slate-400 font-bold mb-1 uppercase">{payload[0].payload.fullName}</p>
                                                    <p className="text-lg font-black">{formatCurrency(payload[0].value)}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar 
                                    dataKey="total" 
                                    radius={[10, 10, 0, 0]}
                                    barSize={40}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={activeTab === 'lentes' ? '#6366f1' : '#10b981'} 
                                            fillOpacity={0.8 + (index / chartData.length) * 0.2}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {!activeYearData && (
                <div className="card text-center p-12 text-slate-400">
                    Seleccione un año para ver el reporte detallado
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
