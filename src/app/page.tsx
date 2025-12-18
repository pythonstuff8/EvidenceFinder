'use client';

import React, { useState, useEffect } from 'react';
import EvidenceCard from '@/components/EvidenceCard';
import FilterChips from '@/components/FilterChips';
import Particles from '@/components/Particles';

interface EvidenceCardData {
  id: string;
  title: string;
  link: string;
  snippet: string;
  description: string;
  relation_to_claim: string;
  source_type: string;
  relevance_score: number;
}

interface SearchResponse {
  query: string;
  evidence_cards: EvidenceCardData[];
  total_results: number;
}

interface SourceType {
  value: string;
  label: string;
}

const API_BASE_URL = typeof window !== 'undefined' ? (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '') : '';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceTypes, setSourceTypes] = useState<SourceType[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('ANALYZING EVIDENCE...');

  const loadingMessages = [
    'INITIALIZING SEARCH PROTOCOL...',
    'BYPASSING KNOWLEDGE BARRIERS...',
    'QUERYING GLOBAL DATA VECTORS...',
    'HARVESTING UNSTRUCTURED EVIDENCE...',
    'DECODING SOURCE CREDIBILITY...',
    'AI MATRIX ANALYSIS IN PROGRESS...',
    'MAPPING DATA RELATIONSHIPS...',
    'FINALIZING EVIDENCE SYNTHESIS...',
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      let index = 0;
      setLoadingMessage(loadingMessages[0]);
      interval = setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[index]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Fetch source types on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/source-types`)
      .then(res => res.json())
      .then(data => setSourceTypes(data.source_types))
      .catch(err => console.error('Failed to fetch source types:', err));
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          source_types: selectedTypes.length > 0 ? selectedTypes : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed. Please try again.');
      }

      const data: SearchResponse = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSourceType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <main className="main-container">
      <Particles />

      {/* Hero Section */}
      <section className="hero">
        <h1 className="hero-title">EVIDENCE FINDER</h1>
        <p className="hero-subtitle">
          Discover verified evidence for any claim or question.
          Powered by AI analysis to help you understand the facts.
        </p>
      </section>

      {/* Search Section */}
      <section className="search-section">
        <form onSubmit={handleSearch}>
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Enter your claim or question..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                type="submit"
                className="search-button"
                disabled={isLoading || !query.trim()}
              >
                {isLoading ? 'SEARCHING...' : 'FIND EVIDENCE'}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Filter Section */}
      {sourceTypes.length > 0 && (
        <FilterChips
          sourceTypes={sourceTypes}
          selectedTypes={selectedTypes}
          onToggle={toggleSourceType}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-container">
          <div className="loading-wrapper">
            <div className="loading-spinner-outer" />
            <div className="loading-spinner-inner" />
            <div className="loading-scanner" />
          </div>
          <p className="loading-text">{loadingMessage}</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <h3 className="error-title">Search Error</h3>
          <p className="error-message">{error}</p>
        </div>
      )}

      {/* Results Section */}
      {results && !isLoading && (
        <section className="results-section">
          <div className="results-header">
            <span className="results-count">
              {results.total_results} evidence sources found
            </span>
            <span className="query-label">
              Query: <span>&quot;{results.query}&quot;</span>
            </span>
          </div>

          {results.evidence_cards.length > 0 ? (
            <div className="evidence-grid">
              {results.evidence_cards.map((card) => (
                <EvidenceCard key={card.id} {...card} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3 className="empty-title">No Evidence Found</h3>
              <p className="empty-text">
                Try rephrasing your query or removing filters to see more results.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Initial Empty State */}
      {!hasSearched && !isLoading && (
        <div className="empty-state">
          <div className="empty-icon">🔬</div>
          <h3 className="empty-title">Ready to Explore</h3>
          <p className="empty-text">
            Enter a claim or question above to discover supporting evidence.
          </p>
        </div>
      )}
    </main>
  );
}
