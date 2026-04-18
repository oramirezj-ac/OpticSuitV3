import React, { useState } from 'react';
import { apiClient } from '../../../services/apiClient';
import { formatDateForInput } from '../../../utils/dateUtils';

const EditSaleModal = ({ sale, onClose, onSuccess }) => {
    // Local state initialized with current sale properties
    const [form, setForm] = useState({
        folioFisico: sale.folioFisico || '',
        fecha: formatDateForInput(sale.fecha) || '',
        totalVenta: sale.totalVenta || 0,
        saldoPendiente: sale.saldoPendiente || 0,
        observacionesGenerales: sale.observacionesGenerales || ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
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
                observacionesGenerales: form.observacionesGenerales
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

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
            <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', maxWidth: '500px', width: '95%' }} className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>Editar Nota de Venta</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                </div>

                {error && (
                    <div className="alert alert-danger mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
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
                            rows="4"
                            value={form.observacionesGenerales}
                            onChange={handleChange}
                            placeholder="Armazones, micas, marcas..."
                        />
                    </div>
                </div>

                <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
                    <button className="btn-primary" onClick={handleSave} disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditSaleModal;
