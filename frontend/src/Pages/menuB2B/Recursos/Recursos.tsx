import { useState, useEffect, useMemo } from 'react';
import {
    FileText,
    Video,
    ShieldCheck,
    Wrench,
    ClipboardList,
    Search,
    X,
    FileCode,
    FileImage,
    Archive,
    Folder,
    ChevronRight,
    ArrowLeft,
    Home
} from 'lucide-react';
import Loader from '../../../Components/common/Loader';
import BotonRecursos from '../../../Components/common/Boton-archivo/BotonRecursos';
import { fetchDynamicResources } from '../../../services/recursosService';
import type { DynamicResource } from '../../../services/recursosService';
import './Recursos.css';

const ICON_MAP: Record<string, React.ElementType> = {
    FileText,
    Video,
    ShieldCheck,
    Wrench,
    ClipboardList,
    Image: FileImage,
    Archive,
    File: FileCode
};

const Recursos: React.FC = () => {
    const [allResources, setAllResources] = useState<DynamicResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    // currentPath es un array de carpetas (ej: ['Maquinas', 'Necta'])
    const [currentPath, setCurrentPath] = useState<string[]>([]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchDynamicResources();
            setAllResources(Array.isArray(data) ? data : []);
            setLoading(false);
        };
        load();
    }, []);

    // 1. Lógica de filtrado y navegación

    const visibleItems = useMemo(() => {
        if (searchTerm.trim().length > 0) {
            // Si buscamos, ignoramos la navegación y mostramos todo lo que coincida
            return { files: allResources.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase())), folders: [] };
        }

        const folders = new Set<string>();
        const files: DynamicResource[] = [];

        allResources.forEach(res => {
            const parts = res.id.split('/'); // res.id es la ruta relativa completa

            // Comprobamos si el recurso está dentro de la ruta actual
            const isInCurrentPath = currentPath.every((folder, index) => parts[index] === folder);

            if (isInCurrentPath) {
                const nextPart = parts[currentPath.length];

                if (nextPart) {
                    if (parts.length > currentPath.length + 1) {
                        // Es una subcarpeta
                        folders.add(nextPart);
                    } else {
                        // Es un archivo directo en este nivel
                        files.push(res);
                    }
                }
            }
        });

        return {
            files,
            folders: Array.from(folders).sort()
        };
    }, [allResources, currentPath, searchTerm]);

    const navigateToFolder = (folderName: string) => {
        setCurrentPath([...currentPath, folderName]);
        setSearchTerm(''); // Limpiamos búsqueda al navegar
    };

    const goBack = () => {
        setCurrentPath(currentPath.slice(0, -1));
    };

    const goToLevel = (index: number) => {
        setCurrentPath(currentPath.slice(0, index + 1));
    };

    return (
        <div className="recursos-page">
            <header className="recursos-header">
                <div className="header-main-info">
                    <div className="breadcrumb-nav">
                        <button className={`breadcrumb-item ${currentPath.length === 0 ? 'active' : ''}`} onClick={() => setCurrentPath([])}>
                            <Home size={20} />
                        </button>
                        {currentPath.map((folder, index) => (
                            <div key={index} className="breadcrumb-wrapper">
                                <ChevronRight size={16} className="separator" />
                                <button className={`breadcrumb-item ${index === currentPath.length - 1 ? 'active' : ''}`} onClick={() => goToLevel(index)}>
                                    {folder}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="header-text">
                        <h1>{currentPath.length > 0 ? currentPath[currentPath.length - 1] : 'Recursos Técnicos'}</h1>
                    </div>
                </div>

                <div className="search-container">
                    <div className="search-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar archivo en cualquier carpeta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input-rec"
                        />
                        {searchTerm && (
                            <button className="clear-search" onClick={() => setSearchTerm('')}>
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="recursos-content">
                {loading ? (
                    <Loader />
                ) : (
                    <>
                        {/* BOTÓN VOLVER (Si no estamos en la raíz) */}
                        {currentPath.length > 0 && !searchTerm && (
                            <button className="back-level-btn" onClick={goBack}>
                                <ArrowLeft size={18} /> Volver a {currentPath.length > 1 ? currentPath[currentPath.length - 2] : 'Inicio'}
                            </button>
                        )}

                        <div className="explorer-grid">
                            {/* RENDER DE CARPETAS */}
                            {visibleItems.folders.map(folder => (
                                <button key={folder} className="folder-item" onClick={() => navigateToFolder(folder)}>
                                    <div className="folder-icon">
                                        <Folder size={32} fill="rgba(79, 70, 229, 0.2)" color="#4f46e5" />
                                    </div>
                                    <span className="folder-name">{folder}</span>
                                    <ChevronRight size={16} className="folder-chevron" />
                                </button>
                            ))}

                            {/* RENDER DE ARCHIVOS */}
                            {visibleItems.files.map(res => (
                                <BotonRecursos
                                    key={res.id}
                                    {...res}
                                    icon={ICON_MAP[res.iconKey] || FileText}
                                    href={res.url}
                                />
                            ))}
                        </div>

                        {/* ESTADO VACÍO */}
                        {visibleItems.folders.length === 0 && visibleItems.files.length === 0 && (
                            <div className="no-results">
                                <Archive size={48} color="rgba(255,255,255,0.1)" />
                                <h3>Carpeta vacía</h3>
                                <p>No hay archivos ni carpetas en este nivel.</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default Recursos;
  