import React, { useEffect, useState, useMemo } from 'react';
import { fetchRepuestosCatalog, type Repuesto } from '../../../services/aprovisionamientoService';
import axios from 'axios';
import { fetchTecnicoInfo } from '../../../services/tecnicoService';
import { useAuth } from '../../../Context/AuthContext';
import { useSelection } from '../../../Context/SelectionContext';
import useBackgroundImage from '../../../Hooks/useBackgroundImage';
import Loader from '../../../Components/common/Loader';
import ErrorMessage from '../../../Components/common/ErrorMessage';
import { remoteLog } from '../../../utils/logger';

// Sub-componentes
import FilterBar from '../../../Components/PedidosRepuestos/FilterBar';
import CatalogTable from '../../../Components/PedidosRepuestos/CatalogTable';
import CartModal from '../../../Components/PedidosRepuestos/CartModal';

import './PedidosRepuestos.css';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CartItem {
    repuesto: Repuesto;
    cantidad: number;
}

// ─── Constantes de Mapeo (Legacy) ──────────────────────────────────────────────

const MAP_AREAS_ALMACEN: Record<string, string> = {
    "TF": "0100", "GC": "0100", "LZA": "0100", "FVE": "0100", "LPA": "0100", "GMR": "0100", "HIE": "0100",
    "PM": "0120", "MN": "0120", "IB": "0120", "FOR": "0120"
};

const FALLBACK_EMAILS: Record<string, string> = {
    "0100": "logistica.canarias@ejemplo.com",
    "0120": "logistica.baleares@ejemplo.com"
};

import { usePermissions } from '../../../Hooks/usePermissions';

export default function PedidosRepuestos({ codigoUsuario: propCodigoUsuario }: { codigoUsuario?: string }) {
    const { user } = useAuth();
    const { isTecnico, isAdmin, canAccessVista } = usePermissions();

    // Prioridad: prop -> user context (nunca localStorage, es manipulable por el cliente)
    const codigoUsuario = propCodigoUsuario || user?.codigo_usuario || user?.id || '';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [catalog, setCatalog] = useState<Repuesto[]>([]);
    const [tecnicoInfo, setTecnicoInfo] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [cart, setCart] = useState<Record<string, CartItem>>({});
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [observations, setObservations] = useState('');
    const [sending, setSending] = useState(false);

    useBackgroundImage("/img/Fondo_Escritorio_2.jpg", "Pedido de repuestos");

    // ─── Verificación de Acceso ───────────────────────────────────────────────

    const isAllowed = useMemo(() => {
        return isTecnico || isAdmin || canAccessVista('PEDREPU');
    }, [isTecnico, isAdmin, canAccessVista]);

    // ─── Carga de datos ───────────────────────────────────────────────────────

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [catData, tInfo] = await Promise.all([
                    fetchRepuestosCatalog(),
                    user?.codigo_usuario ? fetchTecnicoInfo(user.codigo_usuario) : Promise.resolve(null)
                ]);
                if (isMounted) {
                    setCatalog(Array.isArray(catData) ? catData : []);
                    setTecnicoInfo(tInfo);
                }
            } catch (err: any) {
                if (isMounted) setError(err.message || 'Error al cargar los datos.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadData();
        return () => { isMounted = false; };
    }, [codigoUsuario]);

    // ─── Lógica de filtrado ────────────────────────────────────────────────────

    const categories = useMemo(() => {
        const cats = new Set<string>();
        catalog.forEach((r: any) => { if (r.NOMBRE_CATEGORIA) cats.add(r.NOMBRE_CATEGORIA); });
        return ['Todas', ...Array.from(cats)].sort();
    }, [catalog]);

    const filteredCatalog = useMemo(() => {
        return catalog.filter((r: any) => {
            const matchesSearch = r.NOMBRE_REPUESTO.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.CODIGO_REPUESTO.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'Todas' || r.NOMBRE_CATEGORIA === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [catalog, searchTerm, selectedCategory]);

    // ─── Lógica del carrito ────────────────────────────────────────────────────

    const updateCartQuantity = (rep: Repuesto, qty: number) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (qty <= 0) delete newCart[rep.CODIGO_REPUESTO];
            else newCart[rep.CODIGO_REPUESTO] = { repuesto: rep, cantidad: qty };
            return newCart;
        });
    };

    const cartTotalItems = Object.values(cart).reduce((sum, item) => sum + item.cantidad, 0);

    // ─── Envío de pedido ───────────────────────────────────────────────────────

    const handleSendOrder = async () => {
        if (cartTotalItems === 0) return;
        setSending(true);
        try {
            const area = tecnicoInfo?.CODIGO_AREA || '';
            const warehouseCode = MAP_AREAS_ALMACEN[area] || '0100';
            const destEmail = FALLBACK_EMAILS[warehouseCode] || 'logistica@ejemplo.com';

            const payload = {
                destinatario: destEmail,
                codTecnico: codigoUsuario,
                nomTecnico: tecnicoInfo?.NOMBRE_EMPLEADO || user?.nombre || 'Técnico',
                repuestos: Object.values(cart).map(item => ({
                    item: `${item.repuesto.CODIGO_REPUESTO} - ${item.repuesto.NOMBRE_REPUESTO}`,
                    cantidad: String(item.cantidad)
                })),
                mensaje: observations
            };

            const response = await axios.post('/orders/submit', payload, {
                withCredentials: true
            });

            if (response.status === 201 || response.status === 200) {
                alert('¡Pedido enviado correctamente!');
                setCart({});
                setObservations('');
                setIsCartOpen(false);
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Error al enviar el pedido';
            alert(`Error al enviar el pedido: ${errorMsg}`);
        } finally {
            setSending(false);
        }
    };

    // ─── Renderizado ──────────────────────────────────────────────────────────

    if (loading) return <Loader />;
    if (!isAllowed) return (
        <div className="flex flex-col items-center justify-center p-20 text-white">
            <h2 className="text-2xl font-bold mb-4">Acceso Restringido</h2>
            <p>Esta página solo está disponible para técnicos y administradores.</p>
        </div>
    );
    if (error) return <ErrorMessage message={error} onDismiss={() => setError(null)} />;

    return (
        <div className="pedidos-container">
            <div className="header-section">
                <h1 className="title">Pedido de Repuestos</h1>
                <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
                    <img src="/img/carrito-de-compras (1).png" alt="Carrito" />
                    {cartTotalItems > 0 && <span className="cart-badge">{cartTotalItems}</span>}
                </button>
            </div>

            <FilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
            />

            <CatalogTable
                items={filteredCatalog}
                cart={cart}
                onUpdateQuantity={updateCartQuantity}
            />

            <CartModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onUpdateQuantity={updateCartQuantity}
                observations={observations}
                onObservationsChange={setObservations}
                onSend={handleSendOrder}
                sending={sending}
            />
        </div>
    );
}
  