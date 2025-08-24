import React from 'react'
import { Filter, X, Calendar, TrendingUp, Target, Activity } from 'lucide-react'

export default function TradeFilters({
  filters,
  onFilterChange,
  onResetFilters,
  filterOptions = {},
  isLoading = false
}) {
  const {
    pairs = [],
    setups = [],
    statuses = ['open', 'closed']
  } = filterOptions

  const handleFilterChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value, page: 1 }) // Reset to page 1 when filters change
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== 'all' && value !== '' && value !== null
  )

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filter Trades</h3>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
            <Activity className="h-4 w-4" />
            <span>Status</span>
          </label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isLoading}
          >
            <option value="all">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Currency Pair Filter */}
        <div className="space-y-2">
          <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
            <TrendingUp className="h-4 w-4" />
            <span>Pair</span>
          </label>
          <select
            value={filters.pair || 'all'}
            onChange={(e) => handleFilterChange('pair', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isLoading}
          >
            <option value="all">All Pairs</option>
            {pairs.map(pair => (
              <option key={pair} value={pair}>{pair}</option>
            ))}
          </select>
        </div>

        {/* Setup Filter */}
        <div className="space-y-2">
          <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
            <Target className="h-4 w-4" />
            <span>Setup</span>
          </label>
          <select
            value={filters.setup || 'all'}
            onChange={(e) => handleFilterChange('setup', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isLoading}
          >
            <option value="all">All Setups</option>
            {setups.map(setup => (
              <option key={setup} value={setup}>{setup}</option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div className="space-y-2">
          <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4" />
            <span>From Date</span>
          </label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isLoading}
          />
        </div>

        {/* Date To */}
        <div className="space-y-2">
          <label className="flex items-center space-x-1 text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4" />
            <span>To Date</span>
          </label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isLoading}
          />
        </div>

        {/* Sort Options */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Sort By</label>
          <select
            value={`${filters.sortBy || 'date'}-${filters.sortOrder || 'desc'}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-')
              handleFilterChange('sortBy', sortBy)
              handleFilterChange('sortOrder', sortOrder)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isLoading}
          >
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="pnl-desc">P&L (High to Low)</option>
            <option value="pnl-asc">P&L (Low to High)</option>
            <option value="pair-asc">Pair (A-Z)</option>
            <option value="pair-desc">Pair (Z-A)</option>
            <option value="created_at-desc">Recently Added</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">Active filters:</span>
            <div className="flex flex-wrap gap-2">
              {filters.status && filters.status !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                  Status: {filters.status}
                </span>
              )}
              {filters.pair && filters.pair !== 'all' && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md">
                  Pair: {filters.pair}
                </span>
              )}
              {filters.setup && filters.setup !== 'all' && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md">
                  Setup: {filters.setup}
                </span>
              )}
              {filters.dateFrom && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md">
                  From: {filters.dateFrom}
                </span>
              )}
              {filters.dateTo && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md">
                  To: {filters.dateTo}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}