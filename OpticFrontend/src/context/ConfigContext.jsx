import { createContext, useContext, useState } from 'react';
import { authService } from '../services/authService';

const ConfigContext = createContext();

// Configuración por defecto (se usa antes del login)
const defaultConfig = {
    nombreOptica: 'OpticSuit V3',
    colorPrimario: '#007bff',
    colorSecundario: '#6c757d'
};

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState(defaultConfig);

    const applyConfig = (data) => {
        setConfig(data);
        const root = document.documentElement;
        root.style.setProperty('--color-primario', data.colorPrimario);
        root.style.setProperty('--color-secundario', data.colorSecundario);
    };

    const fetchConfig = () => {
        console.log('🔄 [ConfigContext] Iniciando carga de configuración...');

        // ✅ Obtener token JWT vía authService
        const token = authService.getToken();

        if (!token) {
            console.warn('⚠️ [ConfigContext] No hay token, usando configuración por defecto');
            applyConfig(defaultConfig);
            return;
        }

        fetch('/api/configuracion', {
            headers: {
                'Authorization': `Bearer ${token}` // ✅ JWT en header
            }
        })
            .then(res => {
                console.log('📡 [ConfigContext] Respuesta recibida:', res.status, res.statusText);
                if (!res.ok) {
                    console.warn('⚠️ [ConfigContext] No se pudo cargar la configuración, usando valores por defecto');
                    return null;
                }
                return res.json();
            })
            .then(data => {
                if (data) {
                    console.log('✅ [ConfigContext] Configuración recibida:', data);
                    applyConfig(data);
                } else {
                    console.log('⚠️ [ConfigContext] No se recibieron datos, reseteando.');
                    applyConfig(defaultConfig);
                }
            })
            .catch(err => {
                console.error('❌ [ConfigContext] Error al cargar configuración:', err);
                applyConfig(defaultConfig);
            });
    };

    return (
        <ConfigContext.Provider value={{ config, reloadConfig: fetchConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);