import React from 'react';

const SalesIndexFilters = ({
    activeTab,
    availableYears,
    selectedYear,
    setSelectedYear,
    searchTerm,
    setSearchTerm,
    startFolio,
    setStartFolio,
    endFolio,
    setEndFolio,
    handleSearch,
    fetchSalesByYear,
    fetchCounterSales,
    fetchConsultationSales,
    fetchDescendingSales,
    fetchRangeSales,
    setSales
}) => {
    return (
        <>
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
                    <form onSubmit={(e) => { 
                        e.preventDefault(); 
                        let s = startFolio.trim();
                        let f = endFolio.trim();
                        if (/^\d{1,3}$/.test(s)) {
                            s = s.padStart(4, '0');
                            setStartFolio(s);
                        }
                        if (/^\d{1,3}$/.test(f)) {
                            f = f.padStart(4, '0');
                            setEndFolio(f);
                        }
                        fetchRangeSales(s, f); 
                    }} className="flex gap-4 items-end">
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
        </>
    );
};

export default SalesIndexFilters;
