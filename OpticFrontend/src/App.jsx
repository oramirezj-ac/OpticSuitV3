import { useState } from 'react'
import './App.css'

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('Ingrese sus credenciales');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje('Intentando conectar...');

    try {
      // URL de tu contenedor Backend (srv-optica-v3.local / 127.0.0.2)
      const response = await fetch('http://srv-optica-v3.local/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        setMensaje('✅ ¡Acceso concedido! Bienvenido Admin.');
      } else {
        const errorData = await response.json();
        setMensaje('❌ Error: Usuario o contraseña incorrectos.');
        console.log('Detalle del error:', errorData);
      }
    } catch (error) {
      setMensaje('🚫 No se pudo conectar con el servidor.');
      console.error('Error de red:', error);
    }
  };

  return (
    <div className="login-container">
      <h1>Optic Suite v3</h1>
      <div className="card">
        <h3>{mensaje}</h3>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="email"
            placeholder="Email (admin@galileo.com)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Iniciar Sesión</button>
        </form>
      </div>
    </div>
  )
}

export default App