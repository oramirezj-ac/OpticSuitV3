import { useState } from 'react';
import './App.css';
import { useConfig } from './context/ConfigContext';
import Layout from './components/layout/Layout';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mensaje, setMensaje] = useState('Ingresa tus credenciales');

  const { reloadConfig } = useConfig();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje('Intentando conectar...');
    console.log('🔐 [Login] Iniciando login para:', email);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      console.log('📡 [Login] Respuesta del servidor:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [Login] Login exitoso, datos:', data);

        // ✅ Guardar JWT token en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userSchema', data.schema);

        setMensaje('✅ Acceso concedido');
        console.log('🔑 [Login] Token guardado, schema:', data.schema);

        // Recargar configuración con el token
        await reloadConfig();

        console.log('🎯 [Login] Configuración recargada, mostrando dashboard');
        setIsLoggedIn(true);
      } else {
        const errorText = await response.text();
        console.error('❌ [Login] Error:', response.status, errorText);
        setMensaje('❌ Usuario o contraseña incorrectos');
      }
    } catch (error) {
      console.error('🚫 [Login] Error de conexión:', error);
      setMensaje('🚫 Error de conexión con el servidor');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <h1>OpticSuit V3</h1>
        <div className="card">
          <h3>{mensaje}</h3>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              name="email"
              type="email"
              placeholder="admin@opticsuit.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Entrar al Sistema</button>
          </form>
        </div>
      </div>
    );
  }

  return <Layout />;
}

export default App;