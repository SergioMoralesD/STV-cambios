import React from 'react';
import './Loader.css';

interface LoaderProps {
    className?: string;
}

export const Loader: React.FC<LoaderProps> = ({ className = '' }) => {
    return (
        <div className="custom-loader-overlay">
            <span className={`loader ${className}`}></span>
        </div>
    );
};;

export default Loader;
  