import React from 'react';
import ReactDOM from 'react-dom';
import type { Averia } from '../../services/Types';
import { construirHover } from './datosAviso';
import './AveriaDetailModal.css';

interface AveriaDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    averia: Averia | null;
}

const AveriaDetailModal: React.FC<AveriaDetailModalProps> = ({ isOpen, onClose, averia }) => {
    if (!isOpen || !averia) return null;

    const detalle = construirHover(averia);

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Detalle del Aviso</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <pre className="detalle-texto">{detalle}</pre>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default AveriaDetailModal;
  