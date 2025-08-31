// Smart trading pair search input component
// Provides intelligent autocomplete with comprehensive pair database

import React, { useState, useRef, useEffect } from 'react';
import { Search, TrendingUp, Globe, Zap, BarChart3, X, DollarSign, Euro, PoundSterling, Bitcoin, Coins } from 'lucide-react';
import { searchTradingPairs, getPopularPairs, getAllCategories, getPairsByCategory } from '../../utils/data/tradingPairs';

const PairSearchInput = ({ 
  value = '', 
  onChange, 
  placeholder = 'Search trading pairs...', 
  className = '',
  showCategories = true,
  maxResults = 15 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Categories with icons
  const categoryIcons = {
    'Major Forex': Globe,
    'Minor Forex': Globe,
    'Exotic Forex': Globe,
    'Cryptocurrency': Zap,
    'Precious Metals': TrendingUp,
    'Energy': BarChart3,
    'US Indices': BarChart3,
    'Technology Stocks': TrendingUp
  };

  // Update search results when query or category changes
  useEffect(() => {
    if (searchQuery.trim() === '' && selectedCategory === 'all') {
      setSearchResults(getPopularPairs().slice(0, maxResults));
    } else if (searchQuery.trim() === '' && selectedCategory !== 'all') {
      setSearchResults(getPairsByCategory(selectedCategory).slice(0, maxResults));
    } else {
      let results = searchTradingPairs(searchQuery, maxResults * 2);
      
      // Filter by category if selected
      if (selectedCategory !== 'all') {
        results = results.filter(pair => pair.category === selectedCategory);
      }
      
      setSearchResults(results.slice(0, maxResults));
    }
    setHighlightedIndex(-1);
  }, [searchQuery, selectedCategory, maxResults]);

  // Handle input change
  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Update parent immediately for typing
    onChange(query);
    
    if (!isOpen) setIsOpen(true);
  };

  // Handle pair selection
  const handlePairSelect = (pair) => {
    onChange(pair.symbol);
    setSearchQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && searchResults[highlightedIndex]) {
          handlePairSelect(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get specific pair icon based on currency symbols
  const getPairIcon = (symbol) => {
    const pair = symbol.toUpperCase();
    
    // Specific pair icons
    if (pair.includes('EUR')) return <Euro className="w-4 h-4 text-blue-600" />;
    if (pair.includes('GBP')) return <PoundSterling className="w-4 h-4 text-green-600" />;
    if (pair.includes('USD') && !pair.includes('BTC') && !pair.includes('ETH')) return <DollarSign className="w-4 h-4 text-green-700" />;
    if (pair.includes('BTC')) return <Bitcoin className="w-4 h-4 text-orange-500" />;
    if (pair.includes('ETH') || pair.includes('XAU') || pair.includes('GOLD')) return <Coins className="w-4 h-4 text-yellow-600" />;
    if (pair.includes('JPY')) return <span className="w-4 h-4 text-red-600 text-xs font-bold flex items-center justify-center">¥</span>;
    if (pair.includes('CHF')) return <span className="w-4 h-4 text-red-800 text-xs font-bold flex items-center justify-center">₣</span>;
    if (pair.includes('AUD')) return <span className="w-4 h-4 text-blue-800 text-xs font-bold flex items-center justify-center">A$</span>;
    if (pair.includes('CAD')) return <span className="w-4 h-4 text-red-700 text-xs font-bold flex items-center justify-center">C$</span>;
    
    // Fallback to category icon
    return null;
  };

  // Get category icon (enhanced with pair-specific icons)
  const getCategoryIcon = (category, symbol = '') => {
    const pairIcon = getPairIcon(symbol);
    if (pairIcon) return pairIcon;
    
    const Icon = categoryIcons[category] || TrendingUp;
    return <Icon className="w-3 h-3" />;
  };

  // Format pair display
  const formatPairDisplay = (pair) => {
    const parts = pair.symbol.match(/.{1,3}/g) || [pair.symbol];
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return pair.symbol;
  };

  const categories = ['all', ...getAllCategories()];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchQuery || value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
          autoComplete="off"
        />
        
        {(searchQuery || isOpen) && (
          <button
            onClick={() => {
              setSearchQuery('');
              onChange('');
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {/* Categories Filter */}
          {showCategories && (
            <div className="p-2 border-b border-gray-100">
              <div className="flex flex-wrap gap-1">
                {categories.slice(0, 6).map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {category === 'all' ? 'All' : category.replace(' Forex', '').replace(' Stocks', '')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="py-1">
            {searchResults.length === 0 ? (
              <div className="px-4 py-3 text-center text-gray-500 text-sm">
                {searchQuery ? `No pairs found for "${searchQuery}"` : 'Start typing to search pairs...'}
              </div>
            ) : (
              <>
                {searchResults.map((pair, index) => (
                  <button
                    key={`${pair.symbol}-${index}`}
                    onClick={() => handlePairSelect(pair)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between group ${
                      index === highlightedIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getCategoryIcon(pair.category, pair.symbol)}
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {formatPairDisplay(pair)}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-48">
                          {pair.name}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded group-hover:bg-gray-200">
                        {pair.exchange}
                      </span>
                    </div>
                  </button>
                ))}

                {/* Show more indicator */}
                {searchResults.length >= maxResults && (
                  <div className="px-4 py-2 text-center text-xs text-gray-500 border-t border-gray-100">
                    {searchQuery ? 'Refine search to see more results' : 'Keep typing to see more pairs'}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-3 py-2 text-xs text-gray-500 bg-gray-50">
            <div className="flex items-center justify-between">
              <span>💡 Type any trading pair symbol</span>
              <span className="text-gray-400">↑↓ Navigate • Enter Select • Esc Close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PairSearchInput;