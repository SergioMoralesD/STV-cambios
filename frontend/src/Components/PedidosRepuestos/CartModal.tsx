import React from 'react';
import { type Repuesto } from '../../services/aprovisionamientoService';

interface CartItem {
    repuesto: Repuesto;
    cantidad: number;
}

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: Record<string, CartItem>;
    onUpdateQuantity: (rep: Repuesto, qty: number) => void;
    observations: string;
    onObservationsChange: (value: string) => void;
    onSend: () => void;
    sending: boolean;
}

export default function CartModal({
    isOpen,
    onClose,
    cart,
    onUpdateQuantity,
    observations,
    onObservationsChange,
    onSend,
    sending
}: CartModalProps) {
    if (!isOpen) return null;

    const cartItems = Object.values(cart);
    const totalItems = cartItems.reduce((sum, item) => sum + item.cantidad, 0);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Tu Carrito</h2>
                    <button className="close-modal" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {cartItems.length === 0 ? (
                        <p className="empty-cart-msg">El carrito está vacío</p>
                    ) : (
                        <div className="cart-items-list">
                            {cartItems.map(item => (
                                <div key={item.repuesto.CODIGO_REPUESTO} className="cart-item">
                                    <div className="cart-item-info">
                                        <span className="cart-item-code">{item.repuesto.CODIGO_REPUESTO}</span>
                                        <span className="cart-item-name">{item.repuesto.NOMBRE_REPUESTO}</span>
                                    </div>
                                    <div className="cart-item-actions">
                                        <span className="cart-item-qty">{item.cantidad} ud</span>
                                        <button 
                                            className="remove-item"
                                            onClick={() => onUpdateQuantity(item.repuesto, 0)}
                                        >
                                            <img src="/img/eliminar (1).png" alt="Eliminar" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <label className="observations-label">Observaciones del Pedido</label>
                    <textarea 
                        placeholder="Escribe aquí cualquier observación o nota adicional..."
                        className="observations-area"
                        value={observations}
                        onChange={(e) => onObservationsChange(e.target.value)}
                    />
                </div>

                <div className="modal-footer">
                    <button 
                        className="submit-btn" 
                        disabled={totalItems === 0 || sending}
                        onClick={onSend}
                    >
                        {sending ? 'Enviando...' : 'Enviar Pedido'}
                    </button>
                </div>
            </div>
        </div>
    );
}
  