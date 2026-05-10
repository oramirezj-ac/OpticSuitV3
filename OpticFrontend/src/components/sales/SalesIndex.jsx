import React from 'react';
import { useSalesIndex } from './useSalesIndex';
import SalesIndexTabs from './SalesIndexTabs';
import SalesIndexFilters from './SalesIndexFilters';
import SalesIndexTable from './SalesIndexTable';
import SalesIndexCounterModal from './SalesIndexCounterModal';
import SalesIndexCancelModal from './SalesIndexCancelModal';
import './SalesIndex.css';

const SalesIndex = ({ onNavigate }) => {
    const { state, actions } = useSalesIndex();

    const {
        activeTab, sales, availableYears, selectedYear, loading, error,
        searchTerm, startFolio, endFolio, showCounterModal, showCancelModal, modalLoading
    } = state;

    const {
        setActiveTab, setSelectedYear, setSearchTerm, setStartFolio, setEndFolio,
        setShowCounterModal, setShowCancelModal,
        fetchSalesByYear, fetchCounterSales, fetchConsultationSales, fetchDescendingSales, fetchRangeSales,
        handleSearch, handleAddCounterSale, handleRegisterCancelled
    } = actions;

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

            <SalesIndexTabs 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
            />

            <SalesIndexFilters
                activeTab={activeTab}
                availableYears={availableYears}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                startFolio={startFolio}
                setStartFolio={setStartFolio}
                endFolio={endFolio}
                setEndFolio={setEndFolio}
                handleSearch={handleSearch}
                fetchSalesByYear={fetchSalesByYear}
                fetchCounterSales={fetchCounterSales}
                fetchConsultationSales={fetchConsultationSales}
                fetchDescendingSales={fetchDescendingSales}
                fetchRangeSales={fetchRangeSales}
                setSales={actions.setSales}
            />

            {loading ? (
                <div className="loading-container"><div className="loader"></div></div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
                <SalesIndexTable 
                    sales={sales} 
                    activeTab={activeTab} 
                    onNavigate={onNavigate} 
                />
            )}

            <SalesIndexCounterModal 
                show={showCounterModal} 
                onClose={() => setShowCounterModal(false)} 
                onSave={handleAddCounterSale} 
                modalLoading={modalLoading} 
            />

            <SalesIndexCancelModal 
                show={showCancelModal} 
                onClose={() => setShowCancelModal(false)} 
                onSave={handleRegisterCancelled} 
                modalLoading={modalLoading} 
            />
        </div>
    );
};

export default SalesIndex;
