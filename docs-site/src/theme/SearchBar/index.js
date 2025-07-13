import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import './styles.css';

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const history = useHistory();
  const { siteConfig } = useDocusaurusContext();

  // Simple search index - in production, this would be generated at build time
  const [searchIndex, setSearchIndex] = useState([]);

  useEffect(() => {
    // Fetch all docs metadata
    fetch(`${siteConfig.baseUrl}search-index.json`)
      .then(res => res.json())
      .then(data => setSearchIndex(data))
      .catch(() => {
        // Fallback to basic pages if index not available
        setSearchIndex([
          { title: 'Platform Tier', path: '/platform/', content: 'Platform administration system management' },
          { title: 'Tenant Tier', path: '/tenant/', content: 'Tenant administration management' },
          { title: 'Account Tier', path: '/account/', content: 'Account business unit management' },
          { title: 'User Tier', path: '/user/', content: 'User individual operations' },
          { title: 'Public Tier', path: '/public/', content: 'Public access no authentication' },
          { title: 'API Design', path: '/architecture/api-design/', content: 'API architecture design patterns' },
          { title: 'Security', path: '/architecture/security/', content: 'Security architecture authentication' },
          { title: 'Quick Start', path: '/reference/quick-start/', content: 'Getting started guide' },
          { title: 'Deployment', path: '/development/deployment/', content: 'Deployment guide docker kubernetes' },
        ]);
      });
  }, [siteConfig.baseUrl]);

  const handleSearch = useCallback((searchQuery) => {
    if (!searchQuery) {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const searchResults = searchIndex.map(doc => {
      // Calculate relevance score
      let score = 0;
      const titleLower = doc.title.toLowerCase();
      const contentLower = doc.content.toLowerCase();
      const descriptionLower = (doc.description || '').toLowerCase();
      
      // Title matches have highest weight
      if (titleLower.includes(query)) score += 10;
      if (titleLower.startsWith(query)) score += 5;
      
      // Description matches have medium weight
      if (descriptionLower.includes(query)) score += 3;
      
      // Content matches have lower weight
      if (contentLower.includes(query)) score += 1;
      
      // Exact word matches get bonus
      const queryWords = query.split(' ');
      queryWords.forEach(word => {
        if (titleLower.includes(word)) score += 2;
        if (contentLower.includes(word)) score += 1;
      });
      
      return { ...doc, score };
    }).filter(doc => doc.score > 0)
      .sort((a, b) => b.score - a.score);

    setResults(searchResults.slice(0, 10));
    setSelectedIndex(0);
  }, [searchIndex]);

  const handleResultClick = useCallback((path) => {
    // Remove hash fragments for now as they're causing 404s
    const cleanPath = path.split('#')[0];
    history.push(cleanPath);
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(0);
  }, [history]);

  useEffect(() => {
    handleSearch(query);
  }, [query, handleSearch]);

  const handleKeyDown = useCallback((e) => {
    if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !isOpen) {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      const selectedResult = results[selectedIndex];
      if (selectedResult) {
        handleResultClick(selectedResult.path);
      }
    }
  }, [results, selectedIndex, handleResultClick]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <div className="navbar__search">
        <button
          className="navbar__search-button"
          onClick={() => setIsOpen(true)}
          aria-label="Search"
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path
              d="M14.386 14.386l4.0877 4.0877-4.0877-4.0877c-2.9418 2.9419-7.7115 2.9419-10.6533 0-2.9419-2.9418-2.9419-7.7115 0-10.6533 2.9418-2.9419 7.7115-2.9419 10.6533 0 2.9419 2.9418 2.9419 7.7115 0 10.6533z"
              stroke="currentColor"
              fill="none"
              fillRule="evenodd"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <>
          <div className="search-modal-backdrop" onClick={() => setIsOpen(false)} />
          <div className="search-modal">
            <div className="search-modal-content">
              <input
                type="text"
                className="search-input"
                placeholder="Search documentation..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
              />
              
              {results.length > 0 ? (
                <div className="search-results">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`search-result ${index === selectedIndex ? 'search-result-selected' : ''}`}
                      onClick={() => handleResultClick(result.path)}
                    >
                      <div className="search-result-title">{result.title}</div>
                      <div className="search-result-content">{result.description || result.content.substring(0, 100) + '...'}</div>
                      <div className="search-result-path">{result.path.split('#')[0]}</div>
                    </div>
                  ))}
                </div>
              ) : query && (
                <div className="search-no-results">
                  No results found for "{query}"
                </div>
              )}

              <div className="search-footer">
                <span>Press <kbd>⌘K</kbd> to search, <kbd>↑↓</kbd> to navigate, <kbd>Enter</kbd> to select, <kbd>ESC</kbd> to close</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}