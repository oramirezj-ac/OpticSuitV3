import React, { useState, useEffect } from 'react';
import UserForm from './UserForm';
import './UsersIndex.css';

const UsersIndex = ({ onNavigate }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Identificar rol del usuario actual desde localStorage
    const savedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    const isRoot = savedRoles.includes('Root');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar usuarios');
            }

            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedUser(null);
        setShowModal(true);
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    // 🚀 NEW: Navigate to confirmation page
    const requestDelete = (user) => {
        onNavigate('users-delete', { userId: user.id, userName: user.nombreCompleto });
    };

    const handleModalSuccess = () => {
        fetchUsers();
        setShowModal(false); // Cerrar modal después de éxito
    };

    const getRoleBadgeClass = (role) => {
        switch (role?.toLowerCase()) {
            case 'root': return 'badge role-root';
            case 'admin': return 'badge role-admin';
            case 'vendedor': return 'badge role-vendedor';
            default: return 'badge';
        }
    };

    if (loading) return <div className="loading-container"><div className="loader"></div></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="users-container">
            <div className="users-header">
                <h2>
                    <span className="icon">👥</span> Gestión de Usuarios
                </h2>
                <button className="btn-primary" onClick={handleCreate}>
                    + Nuevo Usuario
                </button>
            </div>

            <div className="table-responsive">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Rol</th>
                            {isRoot && <th>Sucursal (Schema)</th>}
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map((user) => (
                                <tr key={user.id}>
                                    <td style={{ fontWeight: '500' }}>{user.nombreCompleto}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={getRoleBadgeClass(user.rol)}>
                                            {user.rol}
                                        </span>
                                    </td>
                                    {isRoot && (
                                        <td>
                                            <span className="badge schema">{user.nombreEsquema}</span>
                                        </td>
                                    )}
                                    <td>
                                        <span className={`status-indicator ${user.estaActivo ? 'status-active' : 'status-inactive'}`}>
                                            {user.estaActivo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn-icon"
                                            style={{ marginRight: '8px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2rem' }}
                                            title="Editar"
                                            onClick={() => handleEdit(user)}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn-icon"
                                            style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2rem' }}
                                            title="Eliminar"
                                            onClick={() => requestDelete(user)}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="empty-state">
                                    No hay usuarios registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Usuario */}
            {showModal && (
                <UserForm
                    user={selectedUser}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleModalSuccess}
                    isRoot={isRoot}
                />
            )}
        </div>
    );
};

export default UsersIndex;
