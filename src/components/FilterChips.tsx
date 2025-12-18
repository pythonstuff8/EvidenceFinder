'use client';

import React from 'react';

interface FilterChipsProps {
    sourceTypes: { value: string; label: string }[];
    selectedTypes: string[];
    onToggle: (type: string) => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({
    sourceTypes,
    selectedTypes,
    onToggle,
}) => {
    return (
        <div className="filter-section">
            <p className="filter-label">Filter by Source Type</p>
            <div className="filter-container">
                {sourceTypes.map((type) => (
                    <button
                        key={type.value}
                        className={`filter-chip ${selectedTypes.includes(type.value) ? 'active' : ''}`}
                        onClick={() => onToggle(type.value)}
                    >
                        {type.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FilterChips;
