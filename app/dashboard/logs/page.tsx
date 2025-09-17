'use client';

import React, { useState, useEffect } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  source: string;
  message: string;
  context: Record<string, any>;
  user_id?: string;
  ip_address?: string;
  tags: string[];
}

const levelColors = {
  DEBUG: 'text-gray-600',
  INFO: 'text-blue-600',
  WARN: 'text-yellow-600',
  ERROR: 'text-red-600',
  CRITICAL: 'text-red-800 font-bold',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [filters, setFilters] = useState({
    level: '',
    source: '',
    search: '',
  });

  // Mock logs for demonstration
  useEffect(() => {
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        level: 'INFO',
        source: 'auth',
        message: 'User login successful',
        context: { userId: 'user123' },
        user_id: 'user123',
        ip_address: '192.168.1.100',
        tags: ['authentication', 'success'],
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'WARN',
        source: 'api',
        message: 'API rate limit approaching',
        context: { endpoint: '/api/users', current: 95, limit: 100 },
        tags: ['rate-limit', 'api'],
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: 'ERROR',
        source: 'database',
        message: 'Connection timeout to database',
        context: { database: 'primary', timeout: 5000 },
        tags: ['database', 'timeout'],
      },
    ];

    setLogs(mockLogs);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredLogs = logs.filter(log => {
    if (filters.level && log.level !== filters.level) return false;
    if (filters.source && log.source !== filters.source) return false;
    if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Application Logs</h1>
        <p className="text-gray-600">Real-time application logging and monitoring</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Level</label>
            <select
              className="w-full p-2 border rounded"
              value={filters.level}
              onChange={(e) => setFilters(f => ({ ...f, level: e.target.value }))}
            >
              <option value="">All levels</option>
              <option value="DEBUG">Debug</option>
              <option value="INFO">Info</option>
              <option value="WARN">Warning</option>
              <option value="ERROR">Error</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Source</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Filter by source..."
              value={filters.source}
              onChange={(e) => setFilters(f => ({ ...f, source: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Logs ({filteredLogs.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsStreaming(!isStreaming)}
                className={`px-4 py-2 rounded ${
                  isStreaming
                    ? 'bg-red-500 text-white'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {isStreaming ? 'Stop Stream' : 'Start Stream'}
              </button>
              <button className="px-4 py-2 bg-gray-500 text-white rounded">
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No logs found matching current filters
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${levelColors[log.level]} bg-gray-100`}>
                        {log.level}
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        {log.source}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>

                  <p className="text-sm font-medium mb-1">{log.message}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {log.user_id && <span>User: {log.user_id}</span>}
                    {log.ip_address && <span>IP: {log.ip_address}</span>}
                  </div>

                  {log.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {log.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 rounded text-xs bg-gray-200 text-gray-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {Object.keys(log.context).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">View context</summary>
                      <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}