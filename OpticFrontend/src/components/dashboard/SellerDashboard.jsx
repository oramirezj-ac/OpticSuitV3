import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { formatCurrency } from '../../utils/formatUtils';
import './Dashboard.css';

// Helper: Format a long date in Spanish (same as AdminDashboard)
const formatLongDate = (date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
};

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

    if (loading) return <div className="dashboard-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 600 }}>Cargando tu actividad del día...</div>;

    // Calculation for brand tracker (example goal: 50 branded frames per year)
    const brandGoal = 50;
    const brandProgress = Math.min(100, (data?.armazonesMarcaAnio / brandGoal) * 100);

    return (
        <div className="dashboard-wrapper animate-fade-in">
            {/* ═══ HERO BANNER ═══ */}
            <div className="dashboard-hero">
                <div className="hero-top-row">
                    <div className="hero-title">
                        <h1>Mi Dashboard</h1>
                        <p>Tu resumen de actividad del día</p>
                        <div className="dashboard-date">{formatLongDate(new Date())}</div>
                    </div>
                </div>
            </div>

            {/* ═══ CONTENT ═══ */}
            <div className="dashboard-content">

                {/* Quick Actions + Today's Stats */}
                <div className="seller-actions-grid">
                    <div className="action-card" onClick={() => onNavigate('patients')}>
                        <div className="icon-wrapper">👤</div>
                        <h3 className="seller-action-title">Capturar Clientes</h3>
                        <p className="seller-action-desc">Registra nuevos pacientes en el sistema</p>
                    </div>
                    
                    <div className="action-card" onClick={() => onNavigate('sales-create')}>
                        <div className="icon-wrapper seller-icon-sales">💰</div>
                        <h3 className="seller-action-title">Capturar Ventas</h3>
                        <p className="seller-action-desc">Genera nuevas notas de venta hoy</p>
                    </div>

                    <div className="seller-stat-card">
                        <div className="seller-stat-card-inner">
                            <span className="metric-label">Cobrado Hoy</span>
                            <div className="seller-stat-amount">{formatCurrency(data?.ventasHoy || 0)}</div>
                            <div className="seller-stat-sub">
                                <span className="seller-stat-dot"></span>
                                {data?.conteoConsultasHoy || 0} consultas médicas registradas hoy
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Divider */}
                <div className="section-divider">
                    <h2>📊 Rendimiento</h2>
                </div>

                {/* Branded Frames Tracker */}
                <div className="chart-container">
                    <div className="seller-perf-header">
                        <div>
                            <h3 className="seller-perf-title">Cómputo de Armazones de Marca</h3>
                            <p className="seller-perf-sub">Basado en tus ventas con comisión este año</p>
                        </div>
                        <div className="seller-perf-counter">
                            <span className="seller-perf-number">{data?.armazonesMarcaAnio || 0}</span>
                            <span className="seller-perf-unit">Ventas</span>
                        </div>
                    </div>

                    <div className="brand-tracker">
                        <div className="seller-progress-labels">
                            <span>Progreso Anual</span>
                            <span>Meta sugerida: {brandGoal}</span>
                        </div>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${brandProgress}%` }}
                            ></div>
                        </div>
                        <p className="seller-progress-note">
                            * Cada venta con comisión registrada a tu nombre suma un punto en este conteo.
                        </p>
                    </div>

                    <div className="seller-commission-footer">
                        <div>
                            <span className="metric-label">Mis Comisiones del Mes</span>
                            <span className="seller-commission-amount">{formatCurrency(data?.comisionesMesActual || 0)}</span>
                        </div>
                        <button className="seller-btn" onClick={() => onNavigate('sales')}>
                            Ver mis ventas →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerDashboard;
