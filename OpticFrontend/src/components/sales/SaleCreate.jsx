import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { getUsers } from '../../services/userApi';
import { formatCurrency } from '../../utils/formatUtils';
import SuccessOverlay from '../common/SuccessOverlay';
import GraduationCard from '../common/GraduationCard';
import './SalesIndex.css';

const SaleCreate = ({ onNavigate, params }) => {
    // Basic Info
    const [folioFisico, setFolioFisico] = useState('');
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
    const [totalVenta, setTotalVenta] = useState(params?.totalAmount || '');
    const [observaciones, setObservaciones] = useState('');
    
    // Commissions
    const [montoComisionTotal, setMontoComisionTotal] = useState(0);
    const [vendedoresSeleccionados, setVendedoresSeleccionados] = useState([]);
    const [availableVendors, setAvailableVendors] = useState([]);
    
    // Graduations
    const [availableGraduations, setAvailableGraduations] = useState([]);
    const [selectedGraduationId, setSelectedGraduationId] = useState(params?.graduationId || '');

    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState(null);

    const TAG_GROUPS = [
        { label: 'Tipo', tags: ['Monofocal', 'Bifocal', 'Progresivo'] },
        { label: 'Material', tags: ['CR-39', 'Hi-Index', 'Policarbonato', 'Trivex', 'Cristal'] },
        { label: 'Tratamiento', tags: ['Antireflejante', 'Fotocromatico', 'Anti blue ray', 'Transition'] },
        { label: 'Armazón', tags: ['Armazón', 'Propio', 'De marca'] },
        { label: 'Contacto', tags: ['Lente de contacto'] }
    ];

    const addObservationTag = (tag) => {
        setObservaciones(prev => {
            if (!prev) return tag;
            const trimmed = prev.trim();
            if (trimmed.endsWith(',')) return `${trimmed} ${tag}`;
            return `${trimmed}, ${tag}`;
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const vendors = await getUsers();
                setAvailableVendors(vendors || []);

                if (params?.patientId) {
                    // Fetch consultations to get graduations for this patient
                    const consultations = await apiClient.get(`/api/consultations/patient/${params.patientId}`);
                    const allGraduations = consultations.reduce((acc, curr) => {
                        return [...acc, ...(curr.graduaciones || [])];
                    }, []);
                    setAvailableGraduations(allGraduations);
                }
            } catch (err) {
                console.error("Error loading data for sale:", err);
            }
        };
        fetchData();
    }, [params?.patientId]);

    const toggleVendor = (userId) => {
        if (vendedoresSeleccionados.includes(userId)) {
            setVendedoresSeleccionados(vendedoresSeleccionados.filter(id => id !== userId));
        } else {
            if (vendedoresSeleccionados.length < 2) {
                setVendedoresSeleccionados([...vendedoresSeleccionados, userId]);
            } else {
                setError('Máximo 2 vendedores por división de comisión (50/50)');
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!folioFisico) {
            setError('El folio físico es obligatorio');
            return;
        }
        
        setLoading(true);
        setError(null);

        try {
            const payload = {
                folioFisico,
                fecha: saleDate ? new Date(saleDate + 'T00:00:00Z').toISOString() : new Date().toISOString(),
                consultaId: params?.consultationId || null,
                pacienteId: params?.patientId || null,
                totalVenta: parseFloat(totalVenta),
                saldoPendiente: parseFloat(totalVenta),
                observacionesGenerales: observaciones,
                montoComisionTotal: parseFloat(montoComisionTotal),
                vendedoresIds: vendedoresSeleccionados,
                detalles: [
                    {
                        pacienteId: params?.patientId,
                        graduacionId: selectedGraduationId || null,
                        descripcionManual: observaciones || "Venta de lentes/armazón"
                        // Other fields can be expanded later
                    }
                ]
            };

            const result = await apiClient.post('/api/sales', payload);
            
            setShowSuccess(true);
            setTimeout(() => {
                onNavigate('sales-details', { saleId: result.id, patientId: params?.patientId });
            }, 2000);
        } catch (err) {
            console.error("Error saving sale:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const commissionPerVendor = vendedoresSeleccionados.length > 0 
        ? (montoComisionTotal / vendedoresSeleccionados.length).toFixed(2)
        : 0;

    const getGraduationLabel = (g) => {
        const type = g.tipoGraduacion || 'Final';
        const od = `OD ${g.odEsfera || 0} / ${g.odCilindro || 0}`;
        const oi = `OI ${g.oiEsfera || 0} / ${g.oiCilindro || 0}`;
        return `[${type.toUpperCase()}] - ${od} | ${oi}`;
    };

    return (
        <div className="sales-container animate-fade-in">
            <SuccessOverlay show={showSuccess} message="Venta Registrada con Éxito" />
            <div className="sales-header">
                <h2><span className="icon">📝</span> Nueva Nota de Venta</h2>
                <button className="btn-secondary" onClick={() => onNavigate('sales')}>Volver al Listado</button>
            </div>

            <form onSubmit={handleSave} className="sales-form-grid">
                {/* Left Column: Core Data */}
                <div className="card">
                    <h3 className="text-lg font-bold mb-4 border-bottom pb-2">Información de la Nota</h3>
                    
                    <div className="form-row-3">
                        <div className="form-group mb-0">
                            <label>Fecha de Venta *</label>
                            <input 
                                type="date" 
                                className="form-input" 
                                required
                                value={saleDate}
                                onChange={(e) => setSaleDate(e.target.value)}
                            />
                        </div>

                        <div className="form-group mb-0">
                            <label>Folio Físico *</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Ej. 0001" 
                                required
                                value={folioFisico}
                                onChange={(e) => setFolioFisico(e.target.value)}
                            />
                        </div>

                        <div className="form-group mb-0">
                            <label>Monto Total *</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="form-input" 
                                placeholder="0.00" 
                                required
                                value={totalVenta}
                                onChange={(e) => setTotalVenta(e.target.value)}
                                onWheel={(e) => e.target.blur()} 
                            />
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <p className="text-xs text-slate-400">Si el folio ya existe, el sistema gestionará el duplicado automáticamente.</p>
                    </div>

                    <div className="form-group">
                        <label>Observaciones de la Nota</label>
                        <textarea 
                            className="form-input" 
                            rows="4"
                            placeholder="Describa los detalles de la venta o use las herramientas de abajo..."
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                        />
                        
                        <div className="observation-tools">
                            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>⚡ LLENADO RÁPIDO</span>
                            </div>
                            {TAG_GROUPS.map(group => (
                                <div key={group.label} className="tag-group">
                                    <span className="tag-label">{group.label}:</span>
                                    {group.tags.map(tag => (
                                        <button 
                                            key={tag} 
                                            type="button" 
                                            className="tag-btn"
                                            onClick={() => addObservationTag(tag)}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Commissions */}
                <div className="card">
                    <h3 className="text-lg font-bold mb-6 border-bottom pb-4 text-slate-700">Vinculación y Comisiones</h3>
                    
                    <div className="form-group">
                        <label>Vincular Graduación (Receta)</label>
                        <select 
                            className="form-input"
                            value={selectedGraduationId}
                            onChange={(e) => setSelectedGraduationId(e.target.value)}
                        >
                            <option value="">-- No vincular o Venta Directa --</option>
                            {availableGraduations.map(g => (
                                <option key={g.id} value={g.id}>
                                    {getGraduationLabel(g)}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Seleccione la graduación que se usará para esta venta.</p>
                        
                        {selectedGraduationId && (
                            <div className="mt-4 animate-slide-up">
                                <GraduationCard 
                                    graduation={availableGraduations.find(g => g.id === selectedGraduationId)} 
                                    title="Vista Previa de la Receta"
                                />
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Monto de Comisión Total</label>
                        <input 
                            type="number" 
                            step="0.01"
                            className="form-input" 
                            placeholder="Ej. 100.00"
                            value={montoComisionTotal}
                            onChange={(e) => setMontoComisionTotal(e.target.value)}
                            onWheel={(e) => e.target.blur()}
                        />
                        <p className="text-xs text-slate-400 mt-1">Se repartirá equitativamente entre los vendedores seleccionados.</p>
                    </div>

                    <div className="form-group">
                        <label>Seleccionar Vendedores (Máx. 2)</label>
                        <div className="vendor-list" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                            {availableVendors.map(v => (
                                <div key={v.id} className="flex items-center gap-2 mb-2 p-2 rounded hover:bg-slate-50 cursor-pointer" onClick={() => toggleVendor(v.id)}>
                                    <input 
                                        type="checkbox" 
                                        checked={vendedoresSeleccionados.includes(v.id)}
                                        readOnly
                                    />
                                    <span style={{ fontSize: '0.9rem' }}>{v.nombreCompleto || v.email}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {vendedoresSeleccionados.length > 0 && (
                        <div className="vendor-split-card animate-slide-up">
                            <h4 className="text-sm font-bold text-slate-600 mb-2">Reparto de Comisión:</h4>
                            {vendedoresSeleccionados.map(id => {
                                const v = availableVendors.find(u => u.id === id);
                                return (
                                    <div key={id} className="vendor-item">
                                        <span>{v?.nombreCompleto || v?.email}</span>
                                        <span className="commission-amount">{formatCurrency(commissionPerVendor)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="md:col-span-2 flex justify-end">
                    <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ padding: '15px 40px', fontSize: '1.1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : 'Guardar Venta y Pasar a Abonos ➔'}
                    </button>
                </div>
                
                {error && <div className="md:col-span-2 alert alert-danger">{error}</div>}
            </form>
        </div>
    );
};

export default SaleCreate;
