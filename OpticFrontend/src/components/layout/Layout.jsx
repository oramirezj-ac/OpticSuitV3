import { useConfig } from '../../context/ConfigContext';
import './Layout.css';

const Layout = ({ children, onLogout }) => {
    const { config } = useConfig();
    const userEmail = localStorage.getItem('userEmail') || 'Usuario';

    // Simplified admin check (in production this should check roles/claims more robustly)
    const isAdmin = userEmail === 'admin@opticsuit.com';
    const activePage = 'dashboard'; // Placeholder for active state logic

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
                            <a href="#" className={activePage === 'dashboard' ? 'active' : ''} onClick={(e) => e.preventDefault()}>
                                <span className="icon">🏠</span> Dashboard
                            </a>
                        </li>
                        <li>
                            <a href="#" onClick={(e) => e.preventDefault()}>
                                <span className="icon">👥</span> Pacientes
                            </a>
                        </li>
                        <li>
                            <a href="#" onClick={(e) => e.preventDefault()}>
                                <span className="icon">📋</span> Consultas Live
                            </a>
                        </li>
                        <li>
                            <a href="#" onClick={(e) => e.preventDefault()}>
                                <span className="icon">🛒</span> Ventas
                            </a>
                        </li>

                        {/* ✅ Solo visible para Administrador */}
                        {isAdmin && (
                            <li>
                                <a href="#" onClick={(e) => e.preventDefault()}>
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