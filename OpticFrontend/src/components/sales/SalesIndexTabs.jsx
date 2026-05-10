import React from 'react';

const SalesIndexTabs = ({ activeTab, setActiveTab }) => {
    return (
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
    );
};

export default SalesIndexTabs;
