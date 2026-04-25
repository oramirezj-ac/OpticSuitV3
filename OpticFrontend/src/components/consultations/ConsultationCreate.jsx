import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { authService } from '../../services/authService';
import SuccessOverlay from '../common/SuccessOverlay';
import './ConsultationCreate.css';

const ConsultationCreate = ({ onNavigate, params }) => {
    // Selection state
    const [selectionTab, setSelectionTab] = useState('recent');
    const [recentPatients, setRecentPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(params?.patientId ? { id: params.patientId, nombre: params.patientName } : null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Form state
    const [tipoConsulta, setTipoConsulta] = useState(params?.type || 'consulta_lentes');
    const [form, setForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        motivoConsulta: '',
        observaciones: '',
        diagnostico: '',
        tratamiento: '',
        costoServicio: (params?.type === 'consulta_medica' || tipoConsulta === 'consulta_medica') ? 300 : 0
    });

    // Pharmacy state (Medical only)
    const [selectedProducts, setSelectedProducts] = useState([]);
    const pharmacyCatalog = [
        { id: 'hipromelosa', name: 'Hipromelosa', price: 100, reason: 'Ojo Seco' },
        { id: 'splash', name: 'Splash', price: 200, reason: 'Ojo Seco' },
        { id: 'hamamelis', name: 'Hamamelis', price: 300, reason: 'Carnosidad' },
        { id: 'ocurelift', name: 'Ocurelift', price: 100, reason: 'Ojo Rojo' }
    ];

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [metodoPago, setMetodoPago] = useState('Efectivo');

    useEffect(() => {
        setForm(prev => ({
            ...prev,
            costoServicio: tipoConsulta === 'consulta_medica' ? 300 : 0
        }));
    }, [tipoConsulta]);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const response = await apiClient.get('/api/patients?pageSize=5');
                setRecentPatients(response.items || []);
            } catch (err) {
                console.error("Error fetching recent patients:", err);
            }
        };
        fetchRecent();
    }, []);

    useEffect(() => {
        if (!form.motivoConsulta) {
            setForm(prev => ({
                ...prev,
                motivoConsulta: tipoConsulta === 'consulta_lentes' ? 'Revisar graduación' : 'Revisión Médica'
            }));
        }
    }, [tipoConsulta]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        try {
            const response = await apiClient.get(`/api/patients?search=${searchQuery}&pageSize=10`);
            setSearchResults(response.items || []);
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const toggleProduct = (prod) => {
        if (selectedProducts.find(p => p.id === prod.id)) {
            setSelectedProducts(selectedProducts.filter(p => p.id !== prod.id));
        } else {
            setSelectedProducts([...selectedProducts, prod]);
        }
    };

    const calculateTotal = () => {
        const productTotal = selectedProducts.reduce((sum, p) => sum + p.price, 0);
        return parseFloat(form.costoServicio || 0) + productTotal;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedPatient) return alert("Por favor seleccione un paciente");

        setLoading(true);
        setError(null);

        try {
            const detallesClinicos = tipoConsulta === 'consulta_medica' ? {
                diagnostico: form.diagnostico,
                tratamiento: form.tratamiento,
                productos: selectedProducts.map(p => p.name).join(', ')
            } : {};

            const total = calculateTotal();

            const payload = {
                pacienteId: selectedPatient.id,
                fecha: form.fecha ? new Date(form.fecha + 'T00:00:00Z').toISOString() : new Date().toISOString(),
                tipoConsulta,
                motivoConsulta: form.motivoConsulta,
                observaciones: form.observaciones,
                costoServicio: total,
                estadoFinanciero: total > 0 ? 'pagado' : 'completo',
                detallesClinicos
            };

            const response = await apiClient.post('/api/consultations', payload);
            
            // AUTOMATIC SALE CREATION if total > 0
            if (total > 0) {
                const now = new Date();
                const timestamp = now.getFullYear() + 
                                String(now.getMonth() + 1).padStart(2, '0') + 
                                String(now.getDate()).padStart(2, '0') + "-" +
                                String(now.getHours()).padStart(2, '0') + 
                                String(now.getMinutes()).padStart(2, '0');
                
                const prefix = tipoConsulta === 'consulta_medica' ? 'MED-' : 'CL-';
                const loggedUserId = authService.getUserId() || null;

                const salePayload = {
                    pacienteId: selectedPatient.id,
                    consultaId: response.id,
                    folioFisico: `${prefix}${timestamp}`,
                    totalVenta: total,
                    saldoPendiente: 0, // Fully paid
                    observacionesGenerales: `Cobro por ${tipoConsulta === 'consulta_medica' ? 'Consulta Médica' : 'Graduación'}`,
                    usuarioId: null,
                    detalles: [
                        { descripcion: `${tipoConsulta === 'consulta_medica' ? 'Consulta Médica' : 'Graduación'}: ${form.motivoConsulta}`, cantidad: 1, precioAplicado: parseFloat(form.costoServicio || 0) },
                        ...selectedProducts.map(p => ({
                            descripcion: `Farmacia: ${p.name}`,
                            cantidad: 1,
                            precioAplicado: p.price
                        }))
                    ],
                    abonosIniciales: [
                        { monto: total, metodoPago: metodoPago, fechaPago: new Date().toISOString(), usuarioId: null }
                    ]
                };
                await apiClient.post('/api/sales', salePayload);
            }

            setShowSuccess(true);
            setTimeout(() => {
                if (tipoConsulta === 'consulta_lentes' && params?.patientId) {
                    onNavigate('consultation-graduations', {
                        consultationId: response.id,
                        patientId: params.patientId
                    });
                } else if (params?.patientId) {
                    onNavigate('patient-details', { patientId: params.patientId });
                } else {
                    onNavigate('consultations');
                }
            }, 2000);
        } catch (err) {
            console.error("Error saving consultation:", err);
            setError(err.message || "Error al guardar la consulta");
        } finally {
            setLoading(false);
        }
    };

    if (selectedPatient) {
        return (
            <div className="consultation-create-container animate-fade-in">
                <SuccessOverlay show={showSuccess} message="Consulta Registrada con Éxito" />
                
                <div className="module-header">
                    <h2><span className="icon">🩺</span> Detalle de la Consulta</h2>
                    <button className="btn-secondary" onClick={() => setSelectedPatient(null)}>Cambiar Paciente</button>
                </div>

                <div className="card">
                    <div className="patient-banner mb-6">
                        <span className="label">Paciente:</span>
                        <span className="name">{selectedPatient.nombre} {selectedPatient.apellidoPaterno} {selectedPatient.apellidoMaterno}</span>
                    </div>

                    <form onSubmit={handleSave}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="form-group mb-4">
                                <label>Fecha de Consulta</label>
                                <input type="date" name="fecha" className="form-input" value={form.fecha} onChange={handleFormChange} required />
                            </div>

                            {!params?.type && (
                                <div className="form-group mb-4">
                                    <label>Tipo de Consulta</label>
                                    <select className="form-input" value={tipoConsulta} onChange={(e) => setTipoConsulta(e.target.value)}>
                                        <option value="consulta_lentes">Consulta por Lentes (Refractiva)</option>
                                        <option value="consulta_medica">Consulta Médica</option>
                                    </select>
                                </div>
                            )}

                            <div className="form-group mb-4">
                                <label>Motivo de Consulta</label>
                                <input type="text" name="motivoConsulta" className="form-input" value={form.motivoConsulta} onChange={handleFormChange} required />
                            </div>

                            <div className="form-group mb-4">
                                <label>Costo de Consulta / Servicio ($)</label>
                                <div className="flex gap-2">
                                    <input type="number" name="costoServicio" className="form-input flex-1" value={form.costoServicio} onChange={handleFormChange} onWheel={(e) => e.target.blur()} />
                                    {tipoConsulta === 'consulta_medica' ? (
                                        <>
                                            <button type="button" className="btn-action-small" onClick={() => setForm({...form, costoServicio: 0})}>Cortesía</button>
                                            <button type="button" className="btn-action-small" onClick={() => setForm({...form, costoServicio: 0})}>Seguimiento</button>
                                        </>
                                    ) : (
                                        <button type="button" className="btn-action-small" onClick={() => setForm({...form, costoServicio: 300})}>Solo Graduación ($300)</button>
                                    )}
                                </div>
                            </div>

                            {tipoConsulta === 'consulta_medica' && (
                                <>
                                    <div className="form-group md:col-span-2 mb-4">
                                        <label className="mb-3 block font-bold text-slate-700">Productos de Farmacia (Tratamiento Sugerido)</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {pharmacyCatalog.map(prod => (
                                                <div 
                                                    key={prod.id} 
                                                    className={`pharmacy-card p-3 border rounded-lg cursor-pointer transition-all ${selectedProducts.find(p => p.id === prod.id) ? 'active' : ''}`}
                                                    onClick={() => toggleProduct(prod)}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-bold text-blue-600 uppercase">{prod.reason}</span>
                                                        <div className={`check-pill ${selectedProducts.find(p => p.id === prod.id) ? 'show' : ''}`}>✓</div>
                                                    </div>
                                                    <div className="font-bold text-slate-800">{prod.name}</div>
                                                    <div className="text-sm text-slate-500 font-bold">${prod.price}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group md:col-span-2 mb-4">
                                        <label>Diagnóstico</label>
                                        <input type="text" name="diagnostico" className="form-input" value={form.diagnostico} onChange={handleFormChange} placeholder="Ej. Conjuntivitis, Blefaritis..." required />
                                    </div>
                                    <div className="form-group md:col-span-2 mb-4">
                                        <label>Tratamiento / Receta</label>
                                        <textarea name="tratamiento" className="form-input" rows="3" value={form.tratamiento} onChange={handleFormChange} required />
                                    </div>
                                </>
                            )}

                            <div className="form-group md:col-span-2 mb-4">
                                <label>Observaciones Generales</label>
                                <textarea name="observaciones" className="form-input" rows="2" value={form.observaciones} onChange={handleFormChange} />
                            </div>
                        </div>

                        <div className="total-summary-bar flex flex-col md:flex-row justify-between items-center p-6 bg-slate-50 rounded-lg border border-slate-200 mt-6 gap-4">
                            <div className="flex flex-col gap-1">
                                <div className="text-2xl font-black text-slate-800">Total: <span className="text-blue-600">${calculateTotal()}</span></div>
                                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Se generará nota auto-pagada</div>
                            </div>

                            {calculateTotal() > 0 && (
                                <div className="flex flex-col items-end gap-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Método de Pago</label>
                                    <div className="flex gap-2">
                                        {['Efectivo', 'Tarjeta', 'Transferencia'].map(m => (
                                            <button 
                                                key={m} 
                                                type="button" 
                                                className={`payment-method-btn ${metodoPago === m ? 'active' : ''}`}
                                                onClick={() => setMetodoPago(m)}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && <div className="alert alert-danger mt-4">{error}</div>}

                        <div className="form-actions mt-8 flex justify-end gap-4">
                            <button type="button" className="btn-secondary" onClick={() => params?.patientId ? onNavigate('patient-details', { patientId: params.patientId }) : onNavigate('consultations')}>Cancelar</button>
                            <button type="submit" className="btn-primary btn-xl" disabled={loading}>
                                {loading ? 'Guardando...' : (calculateTotal() > 0 ? 'Finalizar y Cobrar ➔' : 'Finalizar Consulta ➔')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="consultation-create-container animate-fade-in">
            <div className="module-header">
                <h2><span className="icon">🩺</span> Nueva Consulta</h2>
                <button className="btn-secondary" onClick={() => onNavigate('consultations')}>Volver al Listado</button>
            </div>

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
                                <input type="text" className="form-input flex-1" placeholder="Nombre..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />
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
        </div>
    );
};

export default ConsultationCreate;
