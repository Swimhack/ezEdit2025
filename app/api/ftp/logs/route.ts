/**
 * FTP Activity Logs API
 * Endpoint to retrieve FTP activity logs for troubleshooting
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFTPLogs, getFTPLogStats, getLogsByCorrelationId } from '@/lib/ftp-activity-log';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const websiteId = searchParams.get('websiteId') || undefined;
    const connectionId = searchParams.get('connectionId') || undefined;
    const operation = searchParams.get('operation') || undefined;
    const status = searchParams.get('status') || undefined;
    const correlationId = searchParams.get('correlationId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;
    const since = searchParams.get('since') ? new Date(searchParams.get('since')!) : undefined;
    const statsOnly = searchParams.get('statsOnly') === 'true';

    // If correlation ID is provided, get logs for that specific request
    if (correlationId) {
      const correlationLogs = getLogsByCorrelationId(correlationId);
      return NextResponse.json({
        success: true,
        logs: correlationLogs,
        count: correlationLogs.length,
        correlationId
      });
    }

    // If stats only, return statistics
    if (statsOnly) {
      const stats = getFTPLogStats();
      return NextResponse.json({
        success: true,
        stats
      });
    }

    // Get filtered logs
    const logs = getFTPLogs({
      websiteId,
      connectionId,
      operation,
      status,
      limit,
      since
    });

    // Get statistics
    const stats = getFTPLogStats();

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
      total: stats.total,
      filters: {
        websiteId,
        connectionId,
        operation,
        status,
        limit,
        since: since?.toISOString()
      },
      stats: {
        byStatus: stats.byStatus,
        byOperation: stats.byOperation,
        recentErrors: stats.recentErrors
      }
    });
  } catch (error) {
    console.error('Error retrieving FTP logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve logs'
      },
      { status: 500 }
    );
  }
}



