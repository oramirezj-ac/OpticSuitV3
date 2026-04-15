import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatUtils';
import { formatDateLong } from '../../utils/dateUtils';
import './Dashboard.css';

const SellerDashboard = ({ onNavigate }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await apiClient.get('/api/reporting/seller-summary');
                setData(response);
            } catch (err) {
                console.error("Error fetching seller dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (loading) return <div className="dashboard-wrapper">Cargando tu actividad del día...</div>;

    // Calculation for brand tracker (example goal: 50 branded frames per year)
    const brandGoal = 50;
    const brandProgress = Math.min(100, (data?.armazonesMarcaAnio / brandGoal) * 100);

    return (
        <div className="dashboard-wrapper animate-fade-in">
            <header className="dashboard-header">
                <div>
                    <h1 className="text-slate-800">Mi Dashboard</h1>
                    <p className="text-slate-500 font-medium">{formatDateLong(new Date())}</p>
                </div>
            </header>

            {/* Quick Actions Grid */}
            <div className="summary-grid mb-12">
                <div className="action-card" onClick={() => onNavigate('patients')}>
                    <div className="icon-wrapper">👤</div>
                    <h3 className="font-bold text-lg mb-1">Capturar Clientes</h3>
                    <p className="text-sm text-slate-400">Registra nuevos pacientes en el sistema</p>
                </div>
                
                <div className="action-card" onClick={() => onNavigate('sales-create')}>
                    <div className="icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>💰</div>
                    <h3 className="font-bold text-lg mb-1">Capturar Ventas</h3>
                    <p className="text-sm text-slate-400">Genera nuevas notas de venta hoy</p>
                </div>

                <div className="stats-card">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Hoy hasta ahora</span>
                    <div className="mt-2">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-2xl font-black">{formatCurrency(data?.ventasHoy || 0)}</span>
                            <span className="text-emerald-500 text-sm font-bold">Cobrado</span>
                        </div>
                        <div className="text-xs text-slate-400">
                            {data?.conteoConsultasHoy || 0} consultas médicas registradas hoy
                        </div>
                    </div>
                </div>
            </div>

            {/* Branded Frames Tracker */}
            <div className="chart-container">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Cómputo de Armazones de Marca</h3>
                        <p className="text-sm text-slate-500">Basado en tus ventas con comisión este año</p>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-black text-indigo-600">{data?.armazonesMarcaAnio || 0}</span>
                        <span className="text-slate-400 font-bold ml-1">Ventas</span>
                    </div>
                </div>

                <div className="brand-tracker">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-2">
                        <span>Progreso Anual</span>
                        <span>Meta sugerida: {brandGoal}</span>
                    </div>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${brandProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 italic">
                        * Cada venta con comisión registrada a tu nombre suma un punto en este conteo.
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                    <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase">Mis Comisiones del Mes</span>
                        <span className="text-xl font-bold text-slate-800">{formatCurrency(data?.comisionesMesActual || 0)}</span>
                    </div>
                    <button className="btn-secondary text-sm" onClick={() => onNavigate('sales')}> Ver mis ventas </button>
                </div>
            </div>
        </div>
    );
};

export default SellerDashboard;
