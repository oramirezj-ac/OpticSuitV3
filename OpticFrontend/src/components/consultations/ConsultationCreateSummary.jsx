import React from 'react';

const ConsultationCreateSummary = ({
    calculateTotal, metodoPago, setMetodoPago,
    error, loading, params, onNavigate
}) => {
    return (
        <>
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
        </>
    );
};

export default ConsultationCreateSummary;
