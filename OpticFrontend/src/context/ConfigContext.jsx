import { createContext, useContext, useState } from 'react';

const ConfigContext = createContext();

// Configuración por defecto (se usa antes del login)
const defaultConfig = {
    nombreOptica: 'OpticSuit V3',
    colorPrimario: '#007bff',
    colorSecundario: '#6c757d'
};

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState(defaultConfig);

    const fetchConfig = () => {
        console.log('🔄 [ConfigContext] Iniciando carga de configuración...');

        // ✅ Obtener token JWT de sessionStorage
        const token = sessionStorage.getItem('token');

        if (!token) {
            console.warn('⚠️ [ConfigContext] No hay token, usando configuración por defecto');
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
                    setConfig(data);

                    const root = document.documentElement;
                    root.style.setProperty('--color-primario', data.colorPrimario);
                    root.style.setProperty('--color-secundario', data.colorSecundario);

                    console.log('🎨 [ConfigContext] Variables CSS aplicadas:');
                    console.log('  --color-primario:', data.colorPrimario);
                    console.log('  --color-secundario:', data.colorSecundario);
                    console.log('  Valor actual en DOM:', getComputedStyle(root).getPropertyValue('--color-primario'));
                } else {
                    console.log('⚠️ [ConfigContext] No se recibieron datos');
                }
            })
            .catch(err => {
                console.error('❌ [ConfigContext] Error al cargar configuración:', err);
            });
    };

    return (
        <ConfigContext.Provider value={{ config, reloadConfig: fetchConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);