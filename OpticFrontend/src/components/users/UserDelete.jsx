import React from 'react';
import DeleteConfirmation from '../common/DeleteConfirmation';

const UserDelete = ({ userId, userName, onBack, onSuccess }) => {

    const handleDelete = async () => {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Error al eliminar usuario');
        }

        onSuccess();
    };

    return (
        <DeleteConfirmation
            title="¿Eliminar Usuario?"
            itemName={userName}
            onConfirm={handleDelete}
            onCancel={onBack}
            warningText="Si eliminas este usuario, perderá el acceso al sistema inmediatamente."
            consequences={[
                "El usuario ya no podrá iniciar sesión.",
                "El historial de acciones de este usuario se mantendrá por auditoría, pero no podrá realizar nuevas acciones.",
                "No se puede deshacer esta acción."
            ]}
        />
    );
};

export default UserDelete;
