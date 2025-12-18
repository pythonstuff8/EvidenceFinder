'use client';

import React from 'react';

const Particles: React.FC = () => {
    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 10}s`,
        size: `${Math.random() * 4 + 2}px`,
    }));

    return (
        <div className="particles">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="particle"
                    style={{
                        left: particle.left,
                        animationDelay: particle.animationDelay,
                        width: particle.size,
                        height: particle.size,
                    }}
                />
            ))}
        </div>
    );
};

export default Particles;
