import { NextRequest, NextResponse } from 'next/server';
import { ftpService } from '@/lib/services/ftpService';
import type { FTPConnection } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { action, config, path, content } = await request.json();

    switch (action) {
      case 'connect':
        await ftpService.connect(config as FTPConnection);
        return NextResponse.json({ success: true, message: 'Connected successfully' });

      case 'disconnect':
        await ftpService.disconnect();
        return NextResponse.json({ success: true, message: 'Disconnected successfully' });

      case 'list':
        const files = await ftpService.listFiles(path || '/');
        return NextResponse.json({ success: true, files });

      case 'read':
        const fileContent = await ftpService.readFile(path);
        return NextResponse.json({ success: true, content: fileContent });

      case 'write':
        await ftpService.writeFile(path, content);
        return NextResponse.json({ success: true, message: 'File saved successfully' });

      case 'delete':
        await ftpService.deleteFile(path);
        return NextResponse.json({ success: true, message: 'File deleted successfully' });

      case 'mkdir':
        await ftpService.createDirectory(path);
        return NextResponse.json({ success: true, message: 'Directory created successfully' });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('FTP operation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...(error as any), // Include any additional properties
    } : {};
    
    console.error('Detailed error:', errorDetails);
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
