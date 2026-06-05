import React from 'react';
import { type Repuesto } from '../../services/aprovisionamientoService';

interface CatalogTableProps {
    items: Repuesto[];
    cart: Record<string, { cantidad: number }>;
    onUpdateQuantity: (rep: Repuesto, qty: number) => void;
}

export default function CatalogTable({ items, cart, onUpdateQuantity }: CatalogTableProps) {
    return (
        <div className="catalog-grid">
            <table>
                <thead>
                    <tr>
                        <th>Imagen</th>
                        <th>Información del Repuesto</th>
                        <th>Cantidad</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(rep => (
                        <tr key={rep.CODIGO_REPUESTO} className="catalog-row">
                            <td className="img-cell">
                                <img 
                                    src={rep.IMAGEN ? `data:image/png;base64,${rep.IMAGEN}` : '/img/servicioTuerca.png'} 
                                    alt={rep.NOMBRE_REPUESTO}
                                    className="item-img"
                                    onError={(e) => { e.currentTarget.src = '/img/servicioTuerca.png'; }}
                                />
                            </td>
                            <td className="info-cell">
                                <div className="item-name">{rep.NOMBRE_REPUESTO}</div>
                                <div className="item-code">{rep.CODIGO_REPUESTO}</div>
                                {(rep as any).NOMBRE_CATEGORIA && (
                                    <div className="item-category">{(rep as any).NOMBRE_CATEGORIA}</div>
                                )}
                            </td>
                            <td className="input-cell">
                                <input 
                                    type="number" 
                                    min="0"
                                    max="99"
                                    className="qty-input"
                                    value={cart[rep.CODIGO_REPUESTO]?.cantidad || 0}
                                    onChange={(e) => onUpdateQuantity(rep, parseInt(e.target.value) || 0)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {items.length === 0 && (
                <div className="no-results">No se encontraron repuestos con esos criterios.</div>
            )}
        </div>
    );
}
  