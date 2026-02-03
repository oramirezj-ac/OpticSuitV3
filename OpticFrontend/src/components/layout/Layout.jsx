import { useConfig } from '../../context/ConfigContext';
import './Layout.css';

const Layout = ({ children, onLogout, activePage, onNavigate }) => {
    const { config } = useConfig();
    const userEmail = localStorage.getItem('userEmail') || 'Usuario';
    const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');

    // Check if user is Root or Admin
    const canManageUsers = userRoles.includes('Root') || userRoles.includes('Admin');

    return (
        <div className="layout-container">
            {/* Sidebar - Menú Lateral */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <h2>{config.nombreOptica}</h2>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li>
                            <a
                                href="#"
                                className={activePage === 'dashboard' ? 'active' : ''}
                                onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}
                            >
                                <span className="icon">🏠</span> Dashboard
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                className={activePage === 'patients' ? 'active' : ''}
                                onClick={(e) => { e.preventDefault(); onNavigate('patients'); }}
                            >
                                <span className="icon">👥</span> Pacientes
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                className={activePage === 'live-consultations' ? 'active' : ''}
                                onClick={(e) => { e.preventDefault(); onNavigate('live-consultations'); }}
                            >
                                <span className="icon">📋</span> Consultas Live
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                className={activePage === 'sales' ? 'active' : ''}
                                onClick={(e) => { e.preventDefault(); onNavigate('sales'); }}
                            >
                                <span className="icon">🛒</span> Ventas
                            </a>
                        </li>

                        {/* ✅ Solo visible para Administrador (y Root) */}
                        {canManageUsers && (
                            <li>
                                <a
                                    href="#"
                                    className={activePage === 'users' ? 'active' : ''}
                                    onClick={(e) => { e.preventDefault(); onNavigate('users'); }}
                                >
                                    <span className="icon">⚙️</span> Usuarios
                                </a>
                            </li>
                        )}
                    </ul>
                </nav>

                <div className="sidebar-logout">
                    <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }}>
                        <span className="icon">🚪</span> Cerrar Sesión
                    </a>
                </div>
            </aside>

            {/* Área Principal */}
            <main className="main-content">
                <header className="main-header">
                    <span>Bienvenido, {userEmail}</span>
                    <button className="btn-logout" onClick={onLogout}>Salir</button>
                </header>

                <section className="content-body">
                    {children}
                </section>
            </main>
        </div>
    );
};

export default Layout;