'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Log {
  _id: string;
  type: string;
  message: string;
  wallet?: string;
  ip?: string;
  createdAt: Date;
}

interface LogsPanelProps {
  autoRefresh: boolean;
  lastUpdated: Date;
  onUpdate: () => void;
}

interface LogCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export function LogsPanel({ autoRefresh, lastUpdated, onUpdate }: LogsPanelProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const logCategories: LogCategory[] = [
    { id: 'all', label: 'All Logs', icon: '📊', color: 'zinc' },
    { id: 'listing_created', label: 'Listing Created', icon: '📝', color: 'green' },
    { id: 'listing_purchased', label: 'Listing Purchased', icon: '💰', color: 'green' },
    { id: 'listing_approved', label: 'Listing Approved', icon: '✅', color: 'green' },
    { id: 'listing_rejected', label: 'Listing Rejected', icon: '❌', color: 'orange' },
    { id: 'report_submitted', label: 'Report Submitted', icon: '🚩', color: 'orange' },
    { id: 'comment_posted', label: 'Comment Posted', icon: '💬', color: 'blue' },
    { id: 'info', label: 'Info', icon: 'ℹ️', color: 'zinc' },
    { id: 'error', label: 'Error', icon: '⚠️', color: 'red' },
    { id: 'admin_action', label: 'Admin Action', icon: '🔧', color: 'purple' },
    { id: 'txn_failure', label: 'Txn Failure', icon: '💔', color: 'red' },
    { id: 'admin_fail', label: 'Admin Fail', icon: '🚫', color: 'red' },
  ];

  const fetchLogs = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const response = await axios.get('/api/admin/logs', {
        params: {
          type: logTypeFilter,
          limit: 50,
        },
      });

      if (response.data.success) {
        setLogs(response.data.logs);
        if (!silent) onUpdate();
      }
    } catch (err: any) {
      console.error('Failed to fetch logs:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLogs();
  }, [logTypeFilter]);

  // Auto-refresh polling (silent updates)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs(true); // Silent refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, logTypeFilter]);

  // Manual refresh trigger from parent
  useEffect(() => {
    if (lastUpdated) {
      fetchLogs(true);
    }
  }, [lastUpdated]);

  // Format timestamp
  const formatTime = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleString();
  };

  // Determine log type color
  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'error':
      case 'txn_failure':
      case 'admin_fail':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950';
      case 'listing_approved':
      case 'admin_action':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950';
      case 'listing_created':
      case 'listing_purchased':
      case 'comment_posted':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950';
      case 'listing_rejected':
      case 'report_submitted':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950';
      case 'info':
      default:
        return 'text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900';
    }
  };

  const getLogIcon = (type: string) => {
    const category = logCategories.find(c => c.id === type);
    return category?.icon || '📄';
  };

  const getLogCount = (type: string) => {
    if (type === 'all') return logs.length;
    return logs.filter(log => log.type === type).length;
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-6">
      {/* Sidebar */}
      <div className={`flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-16'}`}>
        <div className="h-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-lg overflow-hidden flex flex-col">
          {/* Sidebar Header */}
          <div className="border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
            {sidebarOpen && (
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                Log Categories
              </h3>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? (
                <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Sidebar Menu */}
          <div className="flex-1 overflow-y-auto p-2">
            <nav className="space-y-1">
              {logCategories.map((category) => {
                const isActive = logTypeFilter === category.id;
                const count = category.id === 'all' ? logs.length : 0;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setLogTypeFilter(category.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                      isActive
                        ? 'bg-green-500 text-white shadow-md'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="text-xl">{category.icon}</span>
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-sm font-medium">
                          {category.label}
                        </span>
                        {isActive && logs.length > 0 && (
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                            {logs.length}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer - Stats */}
          {sidebarOpen && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex justify-between mb-1">
                  <span>Total Logs:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-50">{logs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Auto-refresh:</span>
                  <span className={`font-bold ${autoRefresh ? 'text-green-600' : 'text-zinc-400'}`}>
                    {autoRefresh ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Content Header */}
        <div className="mb-4 flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {logCategories.find(c => c.id === logTypeFilter)?.label || 'All Logs'}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'} found
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
              <span>Loading...</span>
            </div>
          )}
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
          {logs.length === 0 && !loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
                  No logs found
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {logTypeFilter === 'all' 
                    ? 'System logs will appear here as events occur'
                    : `No ${logCategories.find(c => c.id === logTypeFilter)?.label.toLowerCase()} events yet`
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {logs.map((log) => {
                const category = logCategories.find(c => c.id === log.type);
                return (
                  <div
                    key={log._id}
                    className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 text-2xl">
                        {category?.icon || '📄'}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getLogTypeColor(log.type)}`}>
                            {log.type}
                          </span>
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">
                            {formatTime(log.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-zinc-900 dark:text-zinc-50 mb-2">
                          {log.message}
                        </p>

                        {/* Metadata */}
                        {log.wallet && (
                          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                            <div className="flex items-center gap-1">
                              <span className="opacity-60">👛</span>
                              <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                {log.wallet.slice(0, 4)}...{log.wallet.slice(-4)}
                              </code>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

