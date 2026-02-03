import React, { useState } from 'react';
import { useConfig } from '../../context/ConfigContext';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { reloadConfig } = useConfig();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const startLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: 'loading', message: 'Verificando credenciales...' });

    // Artificial delay for slick feel if response is too fast
    const minTime = new Promise(resolve => setTimeout(resolve, 800));

    try {
      const fetchPromise = fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const [response] = await Promise.all([fetchPromise, minTime]);

      if (response.ok) {
        const data = await response.json();

        // Save to LocalStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userSchema', data.schema);
        localStorage.setItem('userRoles', JSON.stringify(data.roles)); // ✅ Guardar roles

        setStatus({ type: 'success', message: `¡Bienvenido, ${data.nombreCompleto || 'Usuario'}!` });

        // Reload config (Theme, Settings)
        await reloadConfig();

        // Notify Parent (App.jsx)
        setTimeout(() => {
          onLoginSuccess();
        }, 500);

      } else {
        setStatus({ type: 'error', message: 'Usuario o contraseña incorrectos' });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'No se pudo conectar con el servidor' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>OpticSuit V3</h1>
          <p>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={startLogin}>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <div className="form-input-wrapper">
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="ej. admin@opticsuit.com"
                value={credentials.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="form-input-wrapper">
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={credentials.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'Conectando...' : 'Ingresar al sistema'}
          </button>

          {status.message && (
            <div className={`login-message ${status.type}`}>
              {status.type === 'loading' && <span className="loader"></span>}
              {status.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
