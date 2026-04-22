import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../services/apiClient';
import { formatDateForInput } from '../../../utils/dateUtils';
import { getUsers } from '../../../services/userApi';
import { formatCurrency } from '../../../utils/formatUtils';

const EditSaleModal = ({ sale, onClose, onSuccess }) => {
    // Calcular comisiones iniciales
    let defaultComisionesTotal = 0;
    let defaultVendedoresIds = [];
    
    if (sale.comisiones && sale.comisiones.length > 0) {
        defaultComisionesTotal = sale.comisiones.reduce((sum, c) => sum + (c.montoComision || 0), 0);
        defaultVendedoresIds = sale.comisiones.map(c => c.usuarioId);
    }

    // Local state initialized with current sale properties
    const [form, setForm] = useState({
        folioFisico: sale.folioFisico || '',
        fecha: formatDateForInput(sale.fecha) || '',
        totalVenta: sale.totalVenta || 0,
        saldoPendiente: sale.saldoPendiente || 0,
        observacionesGenerales: sale.observacionesGenerales || '',
        montoComisionTotal: defaultComisionesTotal,
        vendedoresIds: defaultVendedoresIds
    });

    const [availableVendors, setAvailableVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const vendors = await getUsers();
                setAvailableVendors(vendors || []);
            } catch (err) {
                console.error("Error loading vendors:", err);
            }
        };
        fetchVendors();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleVendorToggle = (userId) => {
        setForm(prev => {
            const currentIds = prev.vendedoresIds || [];
            if (currentIds.includes(userId)) {
                return { ...prev, vendedoresIds: currentIds.filter(id => id !== userId) };
            } else {
                if (currentIds.length < 2) {
                    return { ...prev, vendedoresIds: [...currentIds, userId] };
                } else {
                    setError('Máximo 2 vendedores por división de comisión (50/50)');
                    return prev;
                }
            }
        });
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            // Build the payload keeping specific numbers
            const payload = {
                folioFisico: form.folioFisico,
                fecha: form.fecha ? new Date(`${form.fecha}T00:00:00Z`).toISOString() : null,
                totalVenta: parseFloat(form.totalVenta),
                saldoPendiente: parseFloat(form.saldoPendiente),
                observacionesGenerales: form.observacionesGenerales,
                montoComisionTotal: parseFloat(form.montoComisionTotal || 0),
                vendedoresIds: form.vendedoresIds
            };

            const response = await apiClient.put(`/api/sales/${sale.id}`, payload);

            if (response && response.id) {
                // Success
                onSuccess(response);
            } else {
                throw new Error('Respuesta inválida del servidor.');
            }
        } catch (err) {
            console.error('Error actualizando venta:', err);
            setError(err.message || 'Error al guardar los cambios de la venta.');
        } finally {
            setLoading(false);
        }
    };

    const commissionPerVendor = form.vendedoresIds.length > 0 
        ? ((parseFloat(form.montoComisionTotal) || 0) / form.vendedoresIds.length).toFixed(2)
        : 0;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }} className="animate-fade-in">
            <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>Editar Nota de Venta</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                </div>

                {error && (
                    <div className="alert alert-danger mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Columna Izquierda: Datos Base */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-700 border-b pb-2">Información Principal</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="text-sm font-semibold text-slate-700 block mb-1">Folio Físico</label>
                                <input
                                    type="text"
                                    name="folioFisico"
                                    className="form-input w-full"
                                    value={form.folioFisico}
                                    onChange={handleChange}
                                    placeholder="Ej. NV-001"
                                />
                            </div>

                            <div className="form-group">
                                <label className="text-sm font-semibold text-slate-700 block mb-1">Fecha de Venta</label>
                                <input
                                    type="date"
                                    name="fecha"
                                    className="form-input w-full"
                                    value={form.fecha}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="text-sm font-semibold text-slate-700 block mb-1">Total de la Venta ($)</label>
                                <input
                                    type="number"
                                    name="totalVenta"
                                    className="form-input w-full font-bold"
                                    value={form.totalVenta}
                                    onChange={handleChange}
                                    min="0" step="0.01"
                                />
                            </div>
                            <div className="form-group">
                                <label className="text-sm font-semibold text-slate-700 block mb-1">Saldo Pendiente ($)</label>
                                <input
                                    type="number"
                                    name="saldoPendiente"
                                    className="form-input w-full font-bold text-red-600"
                                    value={form.saldoPendiente}
                                    onChange={handleChange}
                                    min="0" step="0.01"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="text-sm font-semibold text-slate-700 block mb-1">Observaciones / Productos</label>
                            <textarea
                                name="observacionesGenerales"
                                className="form-input w-full"
                                rows="3"
                                value={form.observacionesGenerales}
                                onChange={handleChange}
                                placeholder="Armazones, micas, marcas..."
                            />
                        </div>
                    </div>

                    {/* Columna Derecha: Comisiones */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-700 border-b pb-2">Asignación de Comisiones</h4>
                        
                        <div className="form-group">
                            <label className="text-sm font-semibold text-slate-700 block mb-1">Monto de Comisión Total</label>
                            <input 
                                type="number" 
                                step="0.01"
                                name="montoComisionTotal"
                                className="form-input w-full bg-slate-50" 
                                placeholder="Ej. 100.00"
                                value={form.montoComisionTotal}
                                onChange={handleChange}
                                onWheel={(e) => e.target.blur()}
                            />
                            <p className="text-xs text-slate-400 mt-1">Se repartirá equitativamente entre los vendedores seleccionados.</p>
                        </div>

                        <div className="form-group">
                            <label className="text-sm font-semibold text-slate-700 block mb-1">Seleccionar Vendedores (Máx. 2)</label>
                            <div className="vendor-list" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                                {availableVendors.map(v => (
                                    <div key={v.id} className="flex items-center gap-2 mb-2 p-2 rounded hover:bg-slate-50 cursor-pointer" onClick={() => handleVendorToggle(v.id)}>
                                        <input 
                                            type="checkbox" 
                                            checked={form.vendedoresIds.includes(v.id)}
                                            readOnly
                                        />
                                        <span style={{ fontSize: '0.9rem' }}>{v.nombreCompleto || v.email}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {form.vendedoresIds.length > 0 && (
                            <div className="vendor-split-card animate-slide-up p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                <h4 className="text-sm font-bold text-slate-600 mb-2">Nuevo Reparto de Comisión:</h4>
                                {form.vendedoresIds.map(id => {
                                    const v = availableVendors.find(u => u.id === id);
                                    return (
                                        <div key={id} className="flex justify-between items-center py-1">
                                            <span className="text-sm font-medium text-slate-700">{v?.nombreCompleto || v?.email}</span>
                                            <span className="text-sm font-bold text-indigo-600">{formatCurrency(commissionPerVendor)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
                    <button className="btn-primary" onClick={handleSave} disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar Cambios Terminados'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditSaleModal;
