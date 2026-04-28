import React, { useState } from 'react';
import { deletePatient } from '../../services/patientApi';
import { authService } from '../../services/authService';
import DeleteConfirmation from '../common/DeleteConfirmation';

const PatientDelete = ({ patientId, patientName, onBack, onSuccess, onNavigate }) => {
    const [conflictData, setConflictData] = useState(null);

    const handleDelete = async () => {
        try {
            const token = authService.getToken();
            const response = await fetch(`/api/patients/${patientId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                let errData = {};
                try {
                    const text = await response.text();
                    if (text) {
                        errData = JSON.parse(text);
                    }
                } catch(e) {
                    console.error("No JSON in error response:", e);
                }
                
                if (response.status === 409 && errData.counts) {
                    setConflictData(errData.counts);
                    return;
                }
                throw new Error(errData.message || `Error del servidor: Status ${response.status} ${response.statusText}`);
            }

            onSuccess();
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    if (conflictData) {
        return (
            <div className="modal-overlay">
                <div className="modal-card" style={{ maxWidth: '500px' }}>
                    <div className="modal-header" style={{ borderBottom: '1px solid #fee2e2' }}>
                        <h3 style={{ color: '#b91c1c' }}>⚠️ No se puede eliminar</h3>
                        <button className="btn-close" onClick={onBack}>&times;</button>
                    </div>
                    <div className="modal-body" style={{ padding: '20px' }}>
                        <p style={{ marginBottom: '15px', color: '#475569' }}>
                            Este paciente tiene registros atados que impiden su borrado para proteger su historial. Elimínelos manualmente:
                        </p>
                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155' }}>
                                {conflictData.consultas > 0 && <li><strong>{conflictData.consultas}</strong> consulta(s) asociada(s)</li>}
                                {conflictData.ventas > 0 && <li><strong>{conflictData.ventas}</strong> venta(s) y/o nota(s) asociada(s)</li>}
                            </ul>
                        </div>
                    </div>
                    <div className="modal-footer" style={{ borderTop: 'none', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" className="btn-secondary" onClick={onBack}>Cancelar</button>
                        <button 
                            type="button" 
                            className="btn-primary" 
                            onClick={() => onNavigate && onNavigate('patient-details', { patientId })}
                        >
                            Ir al Expediente a Revisar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <DeleteConfirmation
            title="¿Eliminar Paciente?"
            itemName={patientName}
            onConfirm={handleDelete}
            onCancel={onBack}
            warningText="Eliminar un paciente borrará su perfil permanentemente y solo es posible si no tiene consultas previas."
            consequences={[
                "El perfil desaparecerá de la base de datos.",
                "Esta acción no se puede deshacer."
            ]}
        />
    );
};

export default PatientDelete;
