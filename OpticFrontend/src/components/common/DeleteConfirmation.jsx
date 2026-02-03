import React, { useState } from 'react';
import './DeleteConfirmation.css';

const DeleteConfirmation = ({
    title = '¿Eliminar elemento?',
    itemName,
    onConfirm,
    onCancel,
    warningText = 'Esta acción es irreversible y eliminará permanentemente los datos asociados.',
    consequences = []
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);

    const handleConfirm = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            await onConfirm();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error desconocido al eliminar.');
            setIsDeleting(false);
        }
    };

    return (
        <div className="delete-confirmation-container">
            <div className="delete-icon-wrapper">
                <span className="delete-icon">⚠️</span>
            </div>

            <h2 className="delete-title">{title}</h2>

            <p className="delete-warning-text">
                Estás a punto de eliminar a <span className="delete-item-name">{itemName}</span>.<br />
                {warningText}
            </p>

            {consequences.length > 0 && (
                <div className="delete-consequences">
                    <h4>Consecuencias:</h4>
                    <ul>
                        {consequences.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}

            {error && <div className="alert alert-danger" style={{ marginBottom: '20px' }}>{error}</div>}

            <div className="delete-actions">
                <button
                    className="btn-cancel"
                    onClick={onCancel}
                    disabled={isDeleting}
                >
                    Cancelar
                </button>
                <button
                    className="btn-delete-confirm"
                    onClick={handleConfirm}
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Eliminando...' : 'Sí, Eliminar Permanentemente'}
                </button>
            </div>
        </div>
    );
};

export default DeleteConfirmation;
