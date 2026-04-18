import React from 'react';
import DeleteConfirmation from '../common/DeleteConfirmation';
import { apiClient } from '../../services/apiClient';
import SuccessOverlay from '../common/SuccessOverlay';

const SaleDelete = ({ saleId, onBack, onSuccess }) => {
    const [showSuccess, setShowSuccess] = React.useState(false);

    const handleDelete = async () => {
        try {
            await apiClient.delete(`/api/sales/${saleId}`);
            setShowSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err) {
            alert(err.message || "Fallo al eliminar venta.");
            throw err; // Important: re-throw so DeleteConfirmation knows it failed
        }
    };

    return (
        <>
            <SuccessOverlay show={showSuccess} message="Venta Eliminada con Éxito" />
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
        </>
    );
};

export default SaleDelete;
