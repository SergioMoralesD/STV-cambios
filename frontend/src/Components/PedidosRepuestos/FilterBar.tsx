import React from 'react';

interface FilterBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedCategory: string;
    onCategoryChange: (value: string) => void;
    categories: string[];
}

export default function FilterBar({ 
    searchTerm, 
    onSearchChange, 
    selectedCategory, 
    onCategoryChange, 
    categories 
}: FilterBarProps) {
    return (
        <div className="filters-section">
            <input 
                type="text" 
                placeholder="Buscar por nombre o código..." 
                className="search-input"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
            />
            
            <select 
                className="category-select"
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
            >
                {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
        </div>
    );
}
  