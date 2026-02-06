import React, { useState, useEffect } from 'react';
import './PatientDetails.css';

const PatientDetails = ({ patientId, onBack, onNavigate }) => {
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'consultations', 'sales'

    const [consultations, setConsultations] = useState([]);
    const [sales, setSales] = useState([]);
    const [loadingTab, setLoadingTab] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);

    useEffect(() => {
        const fetchPatientDetails = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/patients/${patientId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Error al cargar expediente');

                const data = await response.json();
                setPatient(data);

                // Also fetch lists if patient loaded
                // Actually, best to fetch on tab click or here differently? 
                // Let's fetch basic info here.
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (patientId) fetchPatientDetails();
    }, [patientId]);

    // Fetch tab data when tab changes
    useEffect(() => {
        const fetchTabData = async () => {
            if (activeTab === 'summary' || !patientId) return;

            setLoadingTab(true);
            try {
                const token = localStorage.getItem('token');
                let url = '';
                if (activeTab === 'consultations') {
                    url = `/api/consultations/patient/${patientId}`;
                } else if (activeTab === 'sales') {
                    url = `/api/sales/patient/${patientId}`;
                }

                if (!url) return;

                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();

                    if (activeTab === 'consultations') {
                        // Handle potential pagination wrapper
                        setConsultations(data.items || (Array.isArray(data) ? data : []));
                    } else if (activeTab === 'sales') {
                        setSales(data.items || (Array.isArray(data) ? data : []));
                    }
                }
            } catch (error) {
                console.error("Error loading tab data", error);
            } finally {
                setLoadingTab(false);
            }
        };

        fetchTabData();
    }, [activeTab, patientId]);


    if (loading) return <div className="loading-container"><div className="loader"></div></div>;
    if (error) return <div className="alert alert-danger">Error: {error} <button onClick={onBack}>Regresar</button></div>;
    if (!patient) return <div>No se encontró el paciente.</div>;

    const isPresbyopicRisk = patient.edad && patient.edad >= 40;

    return (
        <div className="patient-details-container">
            {/* Header / Expediente Info */}
            <div className="patient-header-card">
                <div className="patient-header-top">
                    <button className="btn-back" onClick={onBack}>← Volver a Lista</button>
                    <div className="patient-identity">
                        <h2>{patient.nombre} {patient.apellidoPaterno} {patient.apellidoMaterno}</h2>
                        <div className="patient-badges">
                            <span className="badge-age">{patient.edad ? `${patient.edad} Años` : 'Edad N/D'}</span>
                            {isPresbyopicRisk && <span className="badge-warning">⚠️ Revisar Adición</span>}
                            <span className={`badge-status ${patient.estaActivo ? 'active' : 'inactive'}`}>
                                {patient.estaActivo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="patient-quick-info">
                    <div className="info-item">
                        <span className="label">Teléfono:</span>
                        <span className="value">{patient.telefono || '-'}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Fecha Registro:</span>
                        <span className="value">
                            {patient.fechaRegistro
                                ? new Date(patient.fechaRegistro).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                : '-'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="details-tabs">
                <button
                    className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    Resumen
                </button>
                <button
                    className={`tab-btn ${activeTab === 'consultations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('consultations')}
                >
                    Consultas
                </button>
                <button
                    className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sales')}
                >
                    Ventas
                </button>
            </div>

            {/* Tab Content */}
            <div className="details-content">
                {activeTab === 'summary' && (
                    <div className="summary-view">
                        {/* Ficha Técnica Limpia y Compacta */}
                        <div className="patient-data-sheet">
                            <h4 style={{ color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>Datos Generales</h4>
                            <div className="data-grid">
                                {patient.ocupacion && (
                                    <div className="data-item">
                                        <label>Ocupación</label>
                                        <span>{patient.ocupacion}</span>
                                    </div>
                                )}
                                {patient.edad && (
                                    <div className="data-item">
                                        <label>Edad</label>
                                        <span>{patient.edad} Años</span>
                                    </div>
                                )}

                                {patient.telefono && (
                                    <div className="data-item">
                                        <label>Teléfono</label>
                                        <span>{patient.telefono}</span>
                                    </div>
                                )}
                                {patient.email && (
                                    <div className="data-item">
                                        <label>Email</label>
                                        <span>{patient.email}</span>
                                    </div>
                                )}

                                {patient.direccion && (
                                    <div className="data-item" style={{ gridColumn: 'span 2' }}>
                                        <label>Dirección</label>
                                        <span>{patient.direccion}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {patient.notas && patient.notas.trim() !== '' && (
                            <div className="notes-section" style={{ marginTop: '30px' }}>
                                <h4 style={{ color: '#475569' }}>Notas / Antecedentes</h4>
                                <div className="notes-box">
                                    {patient.notas}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'consultations' && (
                    <div className="tab-pane">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h4>Historial de Consultas</h4>
                            <button className="btn-sm btn-primary" onClick={() => onNavigate && onNavigate('historical')}>+ Nueva</button>
                        </div>

                        {loadingTab ? <div className="loader-sm">Cargando...</div> : (
                            consultations.length === 0 ? (
                                <div className="empty-tab">
                                    <p>No hay consultas registradas.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Motivo</th>
                                                <th>Diagnóstico</th>
                                                <th>Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {consultations.map(c => (
                                                <tr key={c.id}>
                                                    <td>{new Date(c.fecha).toLocaleDateString()}</td>
                                                    <td>{c.motivoConsulta}</td>
                                                    <td>{c.diagnostico || '-'}</td>
                                                    <td>
                                                        <button className="btn-sm btn-outline">Ver Detalles</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                    </div>
                )}

                {activeTab === 'sales' && (
                    <div className="tab-pane">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h4>Historial de Ventas</h4>
                            <button className="btn-sm btn-primary" onClick={() => onNavigate && onNavigate('historical')}>+ Nueva</button>
                        </div>

                        {loadingTab ? <div className="loader-sm">Cargando...</div> : (
                            sales.length === 0 ? (
                                <div className="empty-tab">
                                    <p>No hay ventas registradas.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Folio</th>
                                                <th>Fecha</th>
                                                <th>Total</th>
                                                <th>Saldo</th>
                                                <th>Estatus</th>
                                                <th>Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sales.map(s => (
                                                <tr key={s.id}>
                                                    <td>{s.folioFisico || 'S/F'}</td>
                                                    <td>{new Date(s.fecha).toLocaleDateString()}</td>
                                                    <td>${s.totalVenta?.toFixed(2)}</td>
                                                    <td style={{ color: s.saldoPendiente > 0.1 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                                        ${s.saldoPendiente?.toFixed(2)}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${s.saldoPendiente <= 0.1 ? 'badge-success' : 'badge-warning'}`}
                                                            style={{ backgroundColor: s.saldoPendiente <= 0.1 ? '#dcfce7' : '#fef9c3', color: s.saldoPendiente <= 0.1 ? '#166534' : '#854d0e', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85em' }}>
                                                            {s.saldoPendiente <= 0.1 ? 'PAGADO' : 'PENDIENTE'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className="btn-sm btn-outline-primary" onClick={() => setSelectedSale(s)}>Ver Nota</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* SALE DETAILS MODAL */}
            {selectedSale && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                    <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', maxWidth: '700px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <h3 style={{ margin: 0, color: '#1e293b' }}>Detalle de Venta</h3>
                            <button onClick={() => setSelectedSale(null)} style={{ background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <strong style={{ color: '#64748b', fontSize: '0.9em' }}>FOLIO:</strong>
                                <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{selectedSale.folioFisico || 'N/A'}</div>
                            </div>
                            <div>
                                <strong style={{ color: '#64748b', fontSize: '0.9em' }}>FECHA:</strong>
                                <div>{new Date(selectedSale.fecha).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <strong style={{ color: '#64748b', fontSize: '0.9em' }}>TOTAL:</strong>
                                <div style={{ fontSize: '1.2em', color: '#0f172a' }}>${selectedSale.totalVenta?.toFixed(2)}</div>
                            </div>
                            <div>
                                <strong style={{ color: '#64748b', fontSize: '0.9em' }}>SALDO PENDIENTE:</strong>
                                <div style={{ fontSize: '1.2em', color: selectedSale.saldoPendiente > 0.1 ? '#ef4444' : '#10b981' }}>
                                    ${selectedSale.saldoPendiente?.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <h4 style={{ fontSize: '1em', borderBottom: '2px solid #e2e8f0', paddingBottom: '5px', marginTop: '20px' }}>Productos / Servicios</h4>
                        <table style={{ width: '100%', marginBottom: '20px', fontSize: '0.95em' }}>
                            <thead style={{ background: '#f8fafc', color: '#475569' }}>
                                <tr>
                                    <th style={{ padding: '8px' }}>Descripción</th>
                                    <th style={{ padding: '8px', textAlign: 'right' }}>Precio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedSale.detalles?.map((d, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '8px' }}>{d.descripcionManual || 'Producto sin descripción'}</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>${d.precioAplicado?.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <h4 style={{ fontSize: '1em', borderBottom: '2px solid #e2e8f0', paddingBottom: '5px', marginTop: '20px' }}>Historial de Abonos</h4>
                        {(!selectedSale.abonos || selectedSale.abonos.length === 0) ? (
                            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No hay abonos registrados.</p>
                        ) : (
                            <table style={{ width: '100%', fontSize: '0.95em' }}>
                                <thead style={{ background: '#f8fafc', color: '#475569' }}>
                                    <tr>
                                        <th style={{ padding: '8px' }}>Fecha</th>
                                        <th style={{ padding: '8px' }}>Método</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSale.abonos.map((a, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '8px' }}>{new Date(a.fechaPago).toLocaleDateString()}</td>
                                            <td style={{ padding: '8px' }}>{a.metodoPago}</td>
                                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>${a.monto?.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn-primary" onClick={() => setSelectedSale(null)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDetails;
