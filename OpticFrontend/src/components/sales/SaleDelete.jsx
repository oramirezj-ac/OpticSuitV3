import React from 'react';
import DeleteConfirmation from '../common/DeleteConfirmation';
import { apiClient } from '../../services/apiClient';

const SaleDelete = ({ saleId, onBack, onSuccess }) => {
    const handleDelete = async () => {
        try {
            await apiClient.delete(`/api/sales/${saleId}`);
            onSuccess();
        } catch (err) {
            alert(err.message || "Fallo al eliminar venta.");
        }
    };

    return (
        <DeleteConfirmation
            title="¿Eliminar Nota de Venta?"
            itemName="esta nota de venta"
            onConfirm={handleDelete}
            onCancel={onBack}
            warningText="Está a punto de borrar esta nota de venta permanentemente."
            consequences={[
                "El registro de la nota desaparecerá de la contabilidad.",
                "Se perderán de forma permanente todos sus abonos registrados.",
                "Esta acción no se puede deshacer."
            ]}
        />
    );
};

export default SaleDelete;
