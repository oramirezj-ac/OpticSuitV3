import React, { useState } from 'react';
import RecentConsultations from './tabs/RecentConsultations';
import './ConsultationsIndex.css';

const ConsultationsIndex = ({ onNavigate }) => {
    const [activeTab, setActiveTab] = useState('lentes'); // 'lentes' or 'medicas'

    return (
        <div className="consultations-container animate-fade-in">
            <div className="consultations-header">
                <h2><span className="icon">🩺</span> Gestión de Consultas</h2>
                <div className="header-actions">
                    <button 
                        className="btn-secondary" 
                        onClick={() => onNavigate('consultation-create', { type: 'consulta_medica' })}
                    >
                        + Nueva Consulta Médica
                    </button>
                    <button 
                        className="btn-primary" 
                        onClick={() => onNavigate('consultation-create', { type: 'consulta_lentes' })}
                    >
                        + Nueva Consulta (Lentes)
                    </button>
                </div>
            </div>

            {/* Premium Tabs Navigation */}
            <div className="custom-tabs-container">
                <button
                    className={`custom-tab ${activeTab === 'lentes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('lentes')}
                >
                    🔍 Consultas por Lentes
                </button>
                <button
                    className={`custom-tab ${activeTab === 'medicas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('medicas')}
                >
                    🏥 Consultas Médicas
                </button>
            </div>

            {/* Tab Content */}
            <div className="consultations-content-wrapper card">
                {activeTab === 'lentes' && (
                    <RecentConsultations 
                        onNavigate={onNavigate} 
                        tipoConsulta="consulta_lentes" 
                        title="Historial de Consultas Refractivas"
                    />
                )}
                {activeTab === 'medicas' && (
                    <RecentConsultations 
                        onNavigate={onNavigate} 
                        tipoConsulta="consulta_medica" 
                        title="Historial de Consultas Médicas"
                    />
                )}
            </div>
        </div>
    );
};

export default ConsultationsIndex;
