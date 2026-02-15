import React, { useState, useEffect, useCallback } from 'react';
import PatientForm from './PatientForm';
import './PatientsIndex.css';
import './../users/UsersIndex.css'; // Reusing generic table styles
import { formatPhoneNumber } from '../../utils/formatUtils';
import { getPatients, getAuditPatients, getAuditYears, deletePatient } from '../../services/patientApi';

const PatientsIndex = ({ onNavigate }) => {
    // Tab State: 'recent', 'search', 'all'
    const [activeTab, setActiveTab] = useState('recent');

    // Data State
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

    // Audit State
    const [auditYear, setAuditYear] = useState('');
    const [auditLetter, setAuditLetter] = useState('');
    const [availableYears, setAvailableYears] = useState([]);

    const fetchPatients = useCallback(async (currentTab, currentPage, search) => {
        setLoading(true);
        setError(null);
        try {
            if (currentTab === 'recent') {
                const data = await getPatients({ page: 1, pageSize: 10 });
                setPatients(data.items || []);
                setTotalPages(data.totalPages || 1);
            } else if (currentTab === 'all') {
                const data = await getPatients({ page: currentPage, pageSize: 30 });
                setPatients(data.items || []);
                setTotalPages(data.totalPages || 1);
            } else if (currentTab === 'search') {
                if (!search) {
                    setPatients([]);
                    setLoading(false);
                    return;
                }
                const data = await getPatients({ search, page: 1, pageSize: 50 });
                setPatients(data.items || []);
                setTotalPages(data.totalPages || 1);
            } else if (currentTab === 'audit') {
                if (!auditYear || !auditLetter) {
                    setPatients([]);
                    setLoading(false);
                    return;
                }
                const data = await getAuditPatients(auditYear, auditLetter);
                setPatients(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [auditYear, auditLetter]);

    const fetchAvailableYears = useCallback(async () => {
        try {
            const years = await getAuditYears();
            setAvailableYears(years);
        } catch (e) {
            console.error("Failed to load years", e);
        }
    }, []);

    // Effect to refetch when tab or page changes
    useEffect(() => {
        if (activeTab === 'audit') {
            fetchAvailableYears();
            if (auditYear && auditLetter) fetchPatients('audit', 1, '');
            else setPatients([]);
        } else if (activeTab === 'search') {
            if (searchTerm) fetchPatients('search', 1, searchTerm);
            else setPatients([]);
        } else {
            fetchPatients(activeTab, page, '');
        }
    }, [activeTab, page, fetchPatients, fetchAvailableYears]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPage(1); // Reset page on tab switch
        setSearchTerm(''); // Clear search on tab switch maybe? Or keep it? Keeping it simple.
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchPatients('search', 1, searchTerm);
    };

    const handleCreate = () => {
        setSelectedPatient(null);
        setShowModal(true);
    };

    const handleEdit = (patient) => {
        setSelectedPatient(patient);
        setShowModal(true);
    };

    const requestDelete = (patient) => {
        onNavigate('patients-delete', { patientId: patient.id, patientName: patient.nombre });
    };

    const handleModalSuccess = () => {
        // Refresh current view
        if (activeTab === 'search') fetchPatients('search', 1, searchTerm);
        else fetchPatients(activeTab, page, '');
    };

    return (
        <div className="patients-container">
            <div className="patients-header">
                <h2><span className="icon">👥</span> Pacientes</h2>
                <button className="btn-primary" onClick={handleCreate}>+ Nuevo Paciente</button>
            </div>

            {/* Tabs Navigation */}
            <div className="tabs-nav" style={{ marginBottom: '20px', display: 'flex', gap: '10px', borderBottom: '1px solid #e2e8f0' }}>
                <button
                    className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
                    onClick={() => handleTabChange('recent')}
                    style={{ padding: '10px 15px', border: 'none', background: 'none', borderBottom: activeTab === 'recent' ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontWeight: activeTab === 'recent' ? 'bold' : 'normal' }}
                >
                    Recientes
                </button>
                <button
                    className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
                    onClick={() => handleTabChange('search')}
                    style={{ padding: '10px 15px', border: 'none', background: 'none', borderBottom: activeTab === 'search' ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontWeight: activeTab === 'search' ? 'bold' : 'normal' }}
                >
                    Búsqueda
                </button>
                <button
                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => handleTabChange('all')}
                    style={{ padding: '10px 15px', border: 'none', background: 'none', borderBottom: activeTab === 'all' ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontWeight: activeTab === 'all' ? 'bold' : 'normal' }}
                >
                    Todos los Pacientes
                </button>
                <button
                    className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
                    onClick={() => handleTabChange('audit')}
                    style={{ padding: '10px 15px', border: 'none', background: 'none', borderBottom: activeTab === 'audit' ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontWeight: activeTab === 'audit' ? 'bold' : 'normal' }}
                >
                    Auditoría
                </button>
            </div>

            {/* Tab Content: Search */}
            {activeTab === 'search' && (
                <div className="patients-search-bar" style={{ marginBottom: '20px' }}>
                    <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', width: '100%' }}>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar por nombre, teléfono o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit" className="btn-search">Buscar</button>
                    </form>
                </div>
            )}

            {/* Tab Content: Audit */}
            {activeTab === 'audit' && (
                <div className="audit-filters" style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#64748b' }}>Año de Registro</label>
                        <select
                            className="form-input"
                            value={auditYear}
                            onChange={(e) => setAuditYear(e.target.value)}
                            style={{ minWidth: '150px' }}
                        >
                            <option value="">Seleccione Año</option>
                            {availableYears.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#64748b' }}>Inicial Apellido Paterno</label>
                        <select
                            className="form-input"
                            value={auditLetter}
                            onChange={(e) => setAuditLetter(e.target.value)}
                            style={{ minWidth: '150px' }}
                        >
                            <option value="">Seleccione Letra</option>
                            {/* A-Z options */}
                            {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(char => (
                                <option key={char} value={char}>{char}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ alignSelf: 'flex-end' }}>
                        <button
                            className="btn-primary"
                            disabled={!auditYear || !auditLetter}
                            onClick={() => fetchPatients('audit', 1, '')}
                        >
                            Consultar
                        </button>
                    </div>
                </div>
            )}

            {/* Content Table */}
            {loading ? (
                <div className="loading-container"><div className="loader"></div></div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Nombre Completo</th>
                                    <th>Teléfono</th>
                                    <th>Edad</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.length > 0 ? (
                                    patients.map((patient) => (
                                        <tr key={patient.id}>
                                            <td style={{ fontWeight: '500' }}>
                                                {`${patient.nombre} ${patient.apellidoPaterno || ''} ${patient.apellidoMaterno || ''}`.trim()}
                                            </td>
                                            <td>{formatPhoneNumber(patient.telefono) || '-'}</td>
                                            <td>{patient.edad ? `${patient.edad} años` : '-'}</td>
                                            <td>
                                                <button
                                                    className="btn-icon"
                                                    style={{ marginRight: '8px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2rem' }}
                                                    title="Ver Expediente"
                                                    onClick={() => onNavigate('patient-details', { patientId: patient.id })}
                                                >
                                                    📂
                                                </button>
                                                <button className="btn-icon" style={{ marginRight: '8px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2rem' }} onClick={() => handleEdit(patient)}>✏️</button>
                                                <button className="btn-icon" style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2rem' }} onClick={() => requestDelete(patient)}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="empty-state">
                                            {activeTab === 'search' && !searchTerm ? 'Ingrese un término para buscar.' : 'No se encontraron pacientes.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls for 'all' tab */}
                    {activeTab === 'all' && totalPages > 1 && (
                        <div className="pagination-controls" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                            <button
                                className="btn-secondary"
                                disabled={page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                Anterior
                            </button>
                            <span>Página {page} de {totalPages}</span>
                            <button
                                className="btn-secondary"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}

            {showModal && (
                <PatientForm
                    patient={selectedPatient}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleModalSuccess}
                />
            )}
        </div>
    );
};

export default PatientsIndex;
