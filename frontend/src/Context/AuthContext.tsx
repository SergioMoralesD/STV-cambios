import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { remoteLog } from '../utils/logger';
import type { MenuConfig } from '../config/menuConfig';

/**
 * Interfaz que define la estructura del usuario autenticado devuelto por el backend.
 */
interface User {
    id: number;
    usuario: string;
    correo: string;
    rol_id: number;
    rol_nombre: string;
    activo: number;
    regiones: { codigo: string; nombre: string }[];
    vistas: Record<string, string[]>;
    delegaciones: Record<string, Record<string, string[]>>;
    codigo_usuario?: string | null;
    menuConfig?: MenuConfig;
    session_token?: string; // Token que viene del backend
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (userData: User) => void;
    logout: () => Promise<void>;
    logoutAll: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let checkAuthPromise: Promise<void> | null = null;
let lastCheckTime = 0;
let axiosAuthInterceptorId: number | null = null;

function getStoredToken(): string | null {
    const token = localStorage.getItem('token');
    return token && token !== 'undefined' ? token : null;
}

function syncToken(userData: { session_token?: string; token?: string } | null) {
    const token = userData?.session_token || userData?.token;
    if (token && typeof token === 'string' && token !== 'undefined') {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
}

function setupAxiosAuthInterceptor() {
    if (axiosAuthInterceptorId !== null) {
        return;
    }

    axiosAuthInterceptorId = axios.interceptors.request.use((config) => {
        const token = getStoredToken();
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setupAxiosAuthInterceptor();
    }, []);

    const checkAuth = useCallback(async () => {
        const now = Date.now();

        if (checkAuthPromise) {
            return checkAuthPromise;
        }

        if (lastCheckTime > 0 && (now - lastCheckTime < 2000)) {
            return;
        }

        checkAuthPromise = (async () => {
            try {
                const response = await axios.get('/auth/me', {
                    withCredentials: true,
                });

                const userData = response.data;
                setUser(userData);
                syncToken(userData); // Mantenemos el token sincronizado al refrescar

            } catch (error) {
                remoteLog(`checkAuth error: ${error}`, { level: 'DEBUG', context: 'AuthContext' });
                setUser(null);
                localStorage.removeItem('token');
                throw error;
            } finally {
                lastCheckTime = Date.now();
                setTimeout(() => { checkAuthPromise = null; }, 500);
                setLoading(false);
            }
        })();

        return checkAuthPromise;
    }, []);

    useEffect(() => {
        checkAuth().catch(() => { /* Falla silenciosamente */ });
    }, [checkAuth]);

    const login = (userData: User) => {
        setUser(userData);
        syncToken(userData); // Guardamos el token inmediatamente tras el login
    };

    const logout = async () => {
        try {
            await axios.post('/auth/logout', {}, { withCredentials: true });
        } catch (error) {
            remoteLog(`Error logging out: ${error}`, { level: 'ERROR', context: 'AuthContext' });
        } finally {
            setUser(null);
            localStorage.removeItem('token'); // Limpiamos rastro
        }
    };

    const logoutAll = async () => {
        try {
            await axios.post('/auth/logout-all', {}, { withCredentials: true });
        } catch (error) {
            remoteLog(`Error logging out all sessions: ${error}`, { level: 'ERROR', context: 'AuthContext' });
        } finally {
            setUser(null);
            localStorage.removeItem('token');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, logoutAll, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}  