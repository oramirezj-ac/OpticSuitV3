import { useConfig } from '../../context/ConfigContext';
import './Layout.css';

const Layout = ({ children }) => {
    const { config } = useConfig();

    // ❌ REMOVIDO: El check de !config ya no es necesario porque siempre hay valores por defecto

    return (
        <div className="layout-container">
            {/* Sidebar - Menú Lateral */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <h2>{config.nombreOptica}</h2>
                </div>
                <nav>
                    <ul>
                        <li>Inicio</li>
                        <li>Pacientes</li>
                        <li>Consultas</li>
                        <li>Ventas</li>
                    </ul>
                </nav>
            </aside>

            {/* Área Principal */}
            <main className="main-content">
                <header className="main-header">
                    <span>Bienvenido, Administrador</span>
                    <button className="btn-logout">Salir</button>
                </header>

                <section className="content-body">
                    {children}
                </section>
            </main>
        </div>
    );
};

export default Layout;