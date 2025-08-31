// Advanced import progress modal with real-time updates and cancellation
// Provides detailed feedback during large trade imports

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Upload, X, CheckCircle, AlertCircle, Clock, Zap,
  BarChart3, TrendingUp, AlertTriangle, Pause, Play, Square
} from 'lucide-react';

const ImportProgressModal = ({ 
  isOpen, 
  onClose, 
  importJob, 
  onCancel,
  showDetails = true 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    if (importJob && importJob.status !== 'completed' && importJob.status !== 'failed') {
      setLastUpdate(Date.now());
    }
  }, [importJob]);

  const getStatusIcon = useCallback(() => {
    if (!importJob) return <Upload className="w-5 h-5" />;
    
    switch (importJob.status) {
      case 'initializing':
      case 'validating':
        return <Clock className="w-5 h-5 animate-spin text-blue-500" />;
      case 'processing':
        return <Zap className="w-5 h-5 animate-pulse text-yellow-500" />;
      case 'finalizing':
        return <TrendingUp className="w-5 h-5 animate-bounce text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <Square className="w-5 h-5 text-gray-500" />;
      default:
        return <Upload className="w-5 h-5" />;
    }
  }, [importJob]);

  const getStatusColor = useCallback(() => {
    if (!importJob) return 'text-gray-600';
    
    switch (importJob.status) {
      case 'initializing':
      case 'validating':
        return 'text-blue-600';
      case 'processing':
        return 'text-yellow-600';
      case 'finalizing':
        return 'text-green-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'cancelled':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  }, [importJob]);

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  const calculateETA = () => {
    if (!importJob || !importJob.processedTrades || importJob.processedTrades === 0 || importJob.progress <= 5) {
      return 'Calculating...';
    }
    
    const elapsed = Date.now() - importJob.startTime;
    const tradesPerMs = importJob.processedTrades / elapsed;
    const remaining = Math.max(0, importJob.totalTrades - importJob.processedTrades);
    
    if (tradesPerMs > 0 && remaining > 0) {
      const etaMs = remaining / tradesPerMs;
      if (etaMs > 0 && etaMs < Infinity && etaMs < 24 * 60 * 60 * 1000) { // Less than 24 hours
        return formatDuration(etaMs);
      }
    }
    
    return remaining === 0 ? 'Complete' : 'Calculating...';
  };

  const canCancel = importJob && ['initializing', 'validating', 'processing'].includes(importJob.status);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Trade Import Progress
              </h3>
              <p className="text-sm text-gray-500">
                {importJob?.filename || 'Processing trades...'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            disabled={importJob && importJob.status === 'processing'}
            className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Section */}
        <div className="p-6">
          {importJob ? (
            <>
              {/* Status and Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium capitalize ${getStatusColor()}`}>
                    {importJob.currentPhase || importJob.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.min(Math.round(importJob.progress || 0), 100)}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      importJob.status === 'completed' ? 'bg-green-500' :
                      importJob.status === 'failed' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(Math.max(importJob.progress || 0, 2), 100)}%` }}
                  />
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 mb-1">Total Trades</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {formatNumber(importJob.totalTrades)}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 mb-1">Processed</div>
                  <div className="text-xl font-semibold text-blue-600">
                    {formatNumber(importJob.processedTrades)}
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 mb-1">Successful</div>
                  <div className="text-xl font-semibold text-green-600">
                    {formatNumber(importJob.successfulTrades)}
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 mb-1">Duplicates</div>
                  <div className="text-xl font-semibold text-yellow-600">
                    {formatNumber(importJob.duplicateTrades)}
                  </div>
                </div>
              </div>

              {/* Timing Information */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Elapsed: </span>
                  <span className="font-medium">
                    {formatDuration(Date.now() - importJob.startTime)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">ETA: </span>
                  <span className="font-medium">
                    {importJob.status === 'processing' ? calculateETA() : '—'}
                  </span>
                </div>
              </div>

              {/* Debug Information */}
              {importJob.debugInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-blue-800 mb-2">
                        Import Analysis
                      </div>
                      <div className="text-xs text-blue-700 space-y-1">
                        {importJob.debugInfo.validation && (
                          <div>• Validation: {importJob.debugInfo.validation.valid} valid, {importJob.debugInfo.validation.skipped} skipped</div>
                        )}
                        {importJob.debugInfo.deduplication && (
                          <div>• Deduplication: {importJob.debugInfo.deduplication.unique} unique, {importJob.debugInfo.deduplication.duplicates} duplicates removed</div>
                        )}
                        {importJob.debugInfo.database && (
                          <div>• Database: {importJob.debugInfo.database.imported} imported, {importJob.debugInfo.database.failed} failed</div>
                        )}
                        {importJob.debugInfo.issues && importJob.debugInfo.issues.length > 0 && (
                          <div className="mt-2">
                            <div className="font-medium">Issues detected:</div>
                            {importJob.debugInfo.issues.slice(0, 3).map((issue, idx) => (
                              <div key={idx} className="ml-2">• {issue}</div>
                            ))}
                            {importJob.debugInfo.issues.length > 3 && (
                              <div className="ml-2">• ... and {importJob.debugInfo.issues.length - 3} more</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {importJob.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-red-800 mb-1">
                        Import Error
                      </div>
                      <div className="text-sm text-red-700">
                        {importJob.error}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {importJob.status === 'completed' && (
                <div className={`border rounded-lg p-3 mb-4 ${
                  importJob.successfulTrades > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start space-x-2">
                    {importJob.successfulTrades > 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className={`text-sm flex-1 ${
                      importJob.successfulTrades > 0 ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      <strong>
                        {importJob.successfulTrades > 0 ? 'Import completed successfully!' : 'Import completed with issues!'}
                      </strong>
                      <div className="mt-1">
                        {formatNumber(importJob.successfulTrades)} trades imported in{' '}
                        {formatDuration(importJob.processingTime || 0)}
                        {importJob.duplicateTrades > 0 && 
                          ` (${formatNumber(importJob.duplicateTrades)} duplicates skipped)`
                        }
                      </div>
                      {importJob.debugInfo?.final && (
                        <div className="mt-2 text-xs">
                          <div>Original: {importJob.debugInfo.final.originalCount} trades</div>
                          <div>Database: {importJob.debugInfo.final.databaseImported} imported</div>
                          <div>UI Loaded: {importJob.debugInfo.final.uiLoaded} trades visible</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Details */}
              {showDetails && (
                <div>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full text-left text-sm text-gray-500 hover:text-gray-700 mb-2"
                  >
                    {isExpanded ? 'Hide' : 'Show'} Advanced Details
                  </button>
                  
                  {isExpanded && (
                    <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>Job ID: {importJob.id}</div>
                        <div>Batch Size: {importJob.settings?.chunkSize || 'Default'}</div>
                        <div>Failed: {formatNumber(importJob.failedTrades)}</div>
                        <div>Memory Limit: {importJob.settings?.maxMemoryUsage || 100}MB</div>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div>Last Update: {new Date(lastUpdate).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <div className="text-gray-600">Initializing import...</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          {canCancel && onCancel && (
            <button
              onClick={() => onCancel(importJob.id)}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
            >
              Cancel Import
            </button>
          )}
          
          <button
            onClick={onClose}
            disabled={importJob && importJob.status === 'processing'}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {importJob && ['completed', 'failed', 'cancelled'].includes(importJob.status) ? 'Close' : 'Run in Background'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportProgressModal;