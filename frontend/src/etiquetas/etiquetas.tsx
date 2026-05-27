import React from 'react';
import "./etiquetas.css";

interface EtiquetaIslaProps {
  nombre?: string;
  imagen?: string;
  id?: string;
}

export const EtiquetaIsla: React.FC<EtiquetaIslaProps> = ({ nombre, imagen, id }) => (
  <div className="etiqueta-isla" id={id}>
    {imagen ? <img src={`/img/${imagen}.png`} alt={nombre} /> : null}
    <span>{nombre}</span>
  </div>
);
  