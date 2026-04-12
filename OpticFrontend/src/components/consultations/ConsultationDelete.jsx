import React from 'react';
import DeleteConfirmation from '../common/DeleteConfirmation';
import { apiClient } from '../../services/apiClient';

const ConsultationDelete = ({ consultationId, onBack, onSuccess }) => {
    const handleDelete = async () => {
        try {
            await apiClient.delete(`/api/consultations/${consultationId}`);
            onSuccess();
        } catch (err) {
            // Error handling handled by the caller or a future toast system
            console.error(err);
        }
    };

    return (
        <DeleteConfirmation
            title="¿Eliminar Consulta Médica?"
            itemName="esta consulta"
            onConfirm={handleDelete}
            onCancel={onBack}
            warningText="Está a punto de borrar esta consulta de forma irreversible."
            consequences={[
                "Se borrará el historial de la consulta.",
                "Se borrarán automáticamente todas sus graduaciones adjuntas.",
                "Esta acción no se puede deshacer."
            ]}
        />
    );
};

export default ConsultationDelete;
