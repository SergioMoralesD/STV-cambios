import React from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './BotonRecursos.css';

interface BotonRecursosProps {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    color?: string;
    onClick?: () => void;
    href?: string;
    type?: 'download' | 'link' | 'view';
}

export default function BotonRecursos({ 
    title, 
    subtitle, 
    icon: Icon, 
    color = '#4f46e5', 
    onClick, 
    href,
    type = 'view' 
}: BotonRecursosProps) {
    
    const content = (
        <div className="boton-recursos-content">
            <div className="boton-recursos-icon-wrapper" style={{ backgroundColor: `${color}15`, color }}>
                <Icon size={24} />
            </div>
            <div className="boton-recursos-info">
                <h3 className="boton-recursos-title">{title}</h3>
                {subtitle && <p className="boton-recursos-subtitle">{subtitle}</p>}
            </div>
            <div className="boton-recursos-action">
                {type === 'download' && <Download size={18} />}
                {type === 'link' && <ExternalLink size={18} />}
                {type === 'view' && <FileText size={18} />}
            </div>
        </div>
    );

    if (href) {
        return (
            <a 
                href={href} 
                className="boton-recursos-card" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ '--hover-color': color } as React.CSSProperties}
            >
                {content}
            </a>
        );
    }

    return (
        <button 
            className="boton-recursos-card" 
            onClick={onClick}
            style={{ '--hover-color': color } as React.CSSProperties}
        >
            {content}
        </button>
    );
}
  