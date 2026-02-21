import React, { useState, useEffect } from 'react';
import { ConsultationsProvider, useConsultations } from '../../context/consultations/ConsultationsContext';
import RecentConsultations from './tabs/RecentConsultations';
import CaptureWizardModal from './wizard/CaptureWizardModal';
import './ConsultationsIndex.css';

const ConsultationsContent = ({ onNavigate }) => {
    const { openWizard, isWizardOpen } = useConsultations();
    const [activeTab, setActiveTab] = useState('recent');

    return (
        <div className="consultations-container">
            <div className="consultations-header">
                <h2><span className="icon">🩺</span> Consultas Clínicas</h2>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => openWizard('medical')}>+ Nueva Consulta Médica</button>
                    <button className="btn-primary" onClick={() => openWizard('glasses')}>+ Nueva Consulta (Lentes)</button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="tabs-nav" style={{ marginBottom: '20px', display: 'flex', gap: '10px', borderBottom: '1px solid #e2e8f0' }}>
                <button
                    className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recent')}
                    style={{ padding: '10px 15px', border: 'none', background: 'none', borderBottom: activeTab === 'recent' ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontWeight: activeTab === 'recent' ? 'bold' : 'normal' }}
                >
                    Recientes
                </button>
                {/* Future expansions: Search/All Consultations Tab */}
            </div>

            {/* Tab Content */}
            <div className="consultations-content">
                {activeTab === 'recent' && <RecentConsultations onNavigate={onNavigate} />}
            </div>

            {/* Global Wizard Modal for creating consultations */}
            {isWizardOpen && <CaptureWizardModal onNavigate={onNavigate} />}
        </div>
    );
};

const ConsultationsIndex = ({ onNavigate }) => {
    return (
        <ConsultationsProvider>
            <ConsultationsContent onNavigate={onNavigate} />
        </ConsultationsProvider>
    );
};

export default ConsultationsIndex;
