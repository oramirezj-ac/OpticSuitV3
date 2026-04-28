import React from 'react';
import DeleteConfirmation from '../common/DeleteConfirmation';
import { apiClient } from '../../services/apiClient';

const PaymentDelete = ({ saleId, paymentId, onBack, onSuccess }) => {
    const handleDelete = async () => {
        try {
            await apiClient.delete(`/api/sales/${saleId}/payments/${paymentId}`);
            onSuccess();
        } catch (err) {
            throw err;
        }
    };

    return (
        <DeleteConfirmation
            title="¿Eliminar Abono / Pago?"
            itemName="este abono"
            onConfirm={handleDelete}
            onCancel={onBack}
            warningText="Se eliminará contablemente este abono y se recalculará el saldo de la nota."
            consequences={[
                "El saldo pendiente de la nota aumentará correspondientemente.",
                "Este cambio se reflejará permanentemente en la base de datos."
            ]}
        />
    );
};

export default PaymentDelete;
