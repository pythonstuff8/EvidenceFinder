'use client';

import React from 'react';

interface EvidenceCardProps {
    id: string;
    title: string;
    link: string;
    snippet: string;
    description: string;
    relation_to_claim: string;
    source_type: string;
    relevance_score: number;
}

const getRelationIcon = (relation: string): string => {
    const lowerRelation = relation.toLowerCase();
    if (lowerRelation.includes('support')) return '✓';
    if (lowerRelation.includes('contradict')) return '✗';
    if (lowerRelation.includes('context')) return '📋';
    if (lowerRelation.includes('neutral')) return '〰️';
    return '🔗';
};

const EvidenceCard: React.FC<EvidenceCardProps> = ({
    title,
    link,
    description,
    relation_to_claim,
    source_type,
    relevance_score,
}) => {
    const getDomain = (url: string): string => {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
        } catch {
            return 'source';
        }
    };

    return (
        <article className="evidence-card">
            <div className="card-header">
                <span className={`source-badge ${source_type}`}>
                    {source_type.replace('_', ' ')}
                </span>
                <div className="relevance-score">
                    <span>{Math.round(relevance_score * 100)}%</span>
                    <div className="score-bar">
                        <div
                            className="score-fill"
                            style={{ width: `${relevance_score * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            <h3 className="card-title">{title}</h3>

            <p className="card-description">{description}</p>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="relation-tag" style={{ margin: 0 }}>
                    <span className="relation-icon">{getRelationIcon(relation_to_claim)}</span>
                    <span>{relation_to_claim}</span>
                </div>

                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-link"
                >
                    <span>View on {getDomain(link)}</span>
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15,3 21,3 21,9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                </a>
            </div>
        </article>
    );
};

export default EvidenceCard;
