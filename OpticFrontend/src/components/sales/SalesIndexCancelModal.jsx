import React from 'react';

const SalesIndexCancelModal = ({ show, onClose, onSave, modalLoading }) => {
    if (!show) return null;

    return (
        <div className="sales-modal-overlay">
            <div className="sales-modal">
                <h3 className="text-danger">🚫 Registrar Folio Cancelado</h3>
                <p className="mb-4 text-sm text-slate-400">Registra folios físicos que fueron anulados o dañados.</p>
                <form onSubmit={onSave}>
                    <div className="form-group">
                        <label>Número de Folio</label>
                        <input name="folio" className="form-input" placeholder="Ej. 0101" required />
                    </div>
                    <div className="form-group">
                        <label>Fecha de Cancelación</label>
                        <input name="date" type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} required />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button>
                        <button type="submit" className="btn-primary" disabled={modalLoading}>
                            {modalLoading ? 'Registrando...' : 'Confirmar Cancelación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SalesIndexCancelModal;
