import React from 'react';
import DeleteConfirmation from '../common/DeleteConfirmation';

const PatientDelete = ({ patientId, patientName, onBack, onSuccess }) => {

    const handleDelete = async () => {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/patients/${patientId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Error al eliminar paciente');
        }

        onSuccess();
    };

    return (
        <DeleteConfirmation
            title="¿Eliminar Paciente?"
            itemName={patientName}
            onConfirm={handleDelete}
            onCancel={onBack}
            warningText="Eliminar un paciente borrará su historial clínico de forma permanente."
            consequences={[
                "Se perderán las consultas médicas asociadas.",
                "Se perderán las graduaciones e historial de lentes.",
                "Se desvincularán las ventas asociadas (o quedarán huérfanas).",
                "Esta acción no se puede deshacer."
            ]}
        />
    );
};

export default PatientDelete;
