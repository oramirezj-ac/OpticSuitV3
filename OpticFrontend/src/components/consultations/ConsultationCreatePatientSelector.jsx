import React from 'react';

const ConsultationCreatePatientSelector = ({
    selectionTab, setSelectionTab, recentPatients, searchQuery, setSearchQuery, handleSearch,
    searchResults, setSelectedPatient, loading
}) => {
    return (
        <div className="selection-card card">
            <h3>Paso 1: Seleccione al Paciente</h3>
            
            <div className="selection-tabs flex gap-4 border-bottom mb-6">
                <button className={`tab-link ${selectionTab === 'recent' ? 'active' : ''}`} onClick={() => setSelectionTab('recent')}>Pacientes Recientes</button>
                <button className={`tab-link ${selectionTab === 'search' ? 'active' : ''}`} onClick={() => setSelectionTab('search')}>Buscar Paciente</button>
            </div>

            <div className="selection-content">
                {selectionTab === 'recent' ? (
                    <div className="recent-list grid grid-cols-1 gap-3">
                        {recentPatients.map(p => (
                            <div key={p.id} className="patient-item p-4 border rounded hover:bg-slate-50 cursor-pointer flex justify-between items-center" onClick={() => setSelectedPatient(p)}>
                                <div>
                                    <span className="font-bold text-slate-800">{p.nombre} {p.apellidoPaterno} {p.apellidoMaterno}</span>
                                    <span className="text-xs text-slate-400 ml-4">Visto el: {new Date(p.fechaActualizacion).toLocaleDateString()}</span>
                                </div>
                                <button className="btn-secondary text-xs">Seleccionar</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="search-box">
                        <div className="flex gap-2 mb-6">
                            <input 
                                type="text" 
                                className="form-input flex-1" 
                                placeholder="Nombre..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()} 
                            />
                            <button className="btn-primary" onClick={handleSearch} disabled={loading}>Buscar</button>
                        </div>
                        <div className="search-results recent-list grid grid-cols-1 gap-3">
                            {searchResults.map(p => (
                                <div key={p.id} className="patient-item p-4 border rounded hover:bg-slate-50 cursor-pointer flex justify-between items-center" onClick={() => setSelectedPatient(p)}>
                                    <span className="font-bold text-slate-800">{p.nombre} {p.apellidoPaterno} {p.apellidoMaterno}</span>
                                    <button className="btn-secondary text-xs">Seleccionar</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsultationCreatePatientSelector;
