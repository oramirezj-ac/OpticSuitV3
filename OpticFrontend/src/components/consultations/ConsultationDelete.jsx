import React from 'react';
import DeleteConfirmation from '../common/DeleteConfirmation';
import { apiClient } from '../../services/apiClient';
import SuccessOverlay from '../common/SuccessOverlay';

const ConsultationDelete = ({ consultationId, onBack, onSuccess }) => {
    const [showSuccess, setShowSuccess] = React.useState(false);

    const handleDelete = async () => {
        try {
            await apiClient.delete(`/api/consultations/${consultationId}`);
            setShowSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err) {
            // Error handling handled by the caller or a future toast system
            console.error(err);
        }
    };

    return (
        <>
            <SuccessOverlay show={showSuccess} message="Consulta Eliminada con Éxito" />
            <DeleteConfirmation
            title="¿Eliminar Consulta Médica?"
            itemName="esta consulta"
            onConfirm={handleDelete}
            onCancel={onBack}
            warningText="Está a punto de borrar esta consulta de forma irreversible."
            consequences={[
                "Se borrará el historial de la consulta.",
                "Se borrarán automáticamente todas sus graduaciones adjuntas.",
                "Esta acción es irreversible una vez confirmada."
            ]}
        />
        </>
    );
};

export default ConsultationDelete;
