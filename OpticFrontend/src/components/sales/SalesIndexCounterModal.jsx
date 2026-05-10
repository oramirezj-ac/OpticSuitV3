import React from 'react';

const SalesIndexCounterModal = ({ show, onClose, onSave, modalLoading }) => {
    if (!show) return null;

    return (
        <div className="sales-modal-overlay">
            <div className="sales-modal">
                <h3>⚡ Nueva Venta Mostrador</h3>
                <p className="mb-4 text-sm text-slate-400">Captura rápida de ventas diarias (libre de pacientes).</p>
                <form onSubmit={onSave}>
                    <div className="form-group">
                        <label>Concepto / Productos</label>
                        <input name="concept" className="form-input" placeholder="Ej. Solución 500ml y Estuche" required />
                    </div>
                    <div className="form-group">
                        <label>Monto Total ($)</label>
                        <input name="amount" type="number" step="0.01" className="form-input" placeholder="0.00" required />
                    </div>
                    <div className="form-group">
                        <label>Fecha de Venta</label>
                        <input name="date" type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} required />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={modalLoading}>
                            {modalLoading ? 'Guardando...' : 'Guardar en Mostrador'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SalesIndexCounterModal;
