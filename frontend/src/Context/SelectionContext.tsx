import React, { createContext, useContext, useState } from 'react';

/**
 * Define la estructura del contexto de selección global.
 * Este contexto permite a toda la aplicación (páginas, gráficos, tablas) saber
 * qué región o delegación específica ha seleccionado el usuario en el encabezado superior.
 */
interface SelectionContextType {
    selectedRegion: string | null; // Región seleccionada (ej. 'CANARIAS')
    selectedDelegations: string | null; // Delegación/Isla seleccionada (ej. 'TF', 'GC') o null si son todas las permitidas
    setSelectedRegion: (region: string | null) => void;
    setSelectedDelegations: (delegations: string | null) => void;
    clearSelection: () => void; // Limpia la selección, restaurando los valores por defecto del usuario
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

// Constantes utilizadas como llaves para guardar la selección en el almacenamiento temporal (sessionStorage)
const REGION_KEY = 'stvb2b_selected_region';
const DELEGATIONS_KEY = 'stvb2b_selected_delegations';

/**
 * Componente Proveedor del estado de Selección.
 * Gestiona el estado de qué zona geográfica está consultando el usuario en un momento dado,
 * manteniendo la persistencia a través de recargas de pestaña usando sessionStorage.
 */
export const SelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    
    // Estado de la región. Su valor inicial intenta obtenerse de 3 fuentes en este orden:
    // 1. La URL (útil si se abre un enlace compartido o en pestaña nueva)
    // 2. El sessionStorage (útil si se recarga la misma pestaña pulsando F5)
    // 3. Null (si no hay nada guardado aún)
    const [selectedRegion, setSelectedRegionState] = useState<string | null>(() => {
        const params = new URLSearchParams(window.location.search);
        // Soporta llaves viejas y nuevas por retrocompatibilidad
        const fromUrl = params.get('TR') || params.get('f');
        if (fromUrl) {
            sessionStorage.setItem(REGION_KEY, fromUrl);
            return fromUrl;
        }
        return sessionStorage.getItem(REGION_KEY);
    });
    
    // Lo mismo para delegaciones
    const [selectedDelegations, setSelectedDelegationsState] = useState<string | null>(() => {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('mainplant') || params.get('mps');
        if (fromUrl) {
            sessionStorage.setItem(DELEGATIONS_KEY, fromUrl);
            return fromUrl;
        }
        return sessionStorage.getItem(DELEGATIONS_KEY);
    });

    /**
     * Actualiza el estado local de React y lo guarda simultáneamente en sessionStorage 
     * para que no se pierda al recargar la página.
     */
    const setSelectedRegion = (region: string | null) => {
        setSelectedRegionState(region);
        if (region) {
            sessionStorage.setItem(REGION_KEY, region);
        } else {
            sessionStorage.removeItem(REGION_KEY);
        }
    };

    /**
     * Igual que setSelectedRegion pero para delegaciones (mainplants).
     */
    const setSelectedDelegations = (delegations: string | null) => {
        setSelectedDelegationsState(delegations);
        if (delegations) {
            sessionStorage.setItem(DELEGATIONS_KEY, delegations);
        } else {
            sessionStorage.removeItem(DELEGATIONS_KEY);
        }
    };

    /**
     * Limpia completamente los filtros seleccionados, forzando a la aplicación
     * a usar los permisos geográficos por defecto configurados para ese usuario.
     */
    const clearSelection = () => {
        setSelectedRegion(null);
        setSelectedDelegations(null);
    };

    return (
        <SelectionContext.Provider value={{ 
            selectedRegion, 
            selectedDelegations, 
            setSelectedRegion, 
            setSelectedDelegations,
            clearSelection 
        }}>
            {children}
        </SelectionContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
/**
 * Hook personalizado para acceder y modificar fácilmente los parámetros de región/delegación seleccionados.
 */
export function useSelection() {
    const context = useContext(SelectionContext);
    if (context === undefined) {
        throw new Error('useSelection must be used within a SelectionProvider');
    }
    return context;
}
  