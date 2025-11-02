import { NextRequest, NextResponse } from 'next/server';
import { wixService } from '@/lib/services/wixService';
import type { WixConnection } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { action, config, path, content, pageId, collectionId } = await request.json();

    switch (action) {
      case 'connect':
        await wixService.connect(config as WixConnection);
        return NextResponse.json({ success: true, message: 'Connected successfully' });

      case 'disconnect':
        await wixService.disconnect();
        return NextResponse.json({ success: true, message: 'Disconnected successfully' });

      case 'getTree':
        const tree = await wixService.getFileTree();
        return NextResponse.json({ success: true, tree });

      case 'getContent':
        const fileContent = await wixService.getFileContent(path);
        return NextResponse.json({ success: true, content: fileContent });

      case 'updateContent':
        await wixService.updateFileContent(path, content);
        return NextResponse.json({ success: true, message: 'Content updated successfully' });

      case 'getPages':
        const pages = await wixService.getPages();
        return NextResponse.json({ success: true, pages });

      case 'getPage':
        const page = await wixService.getPage(pageId);
        return NextResponse.json({ success: true, page });

      case 'getCollections':
        const collections = await wixService.getCollections();
        return NextResponse.json({ success: true, collections });

      case 'getCollectionItems':
        const items = await wixService.getCollectionItems(collectionId);
        return NextResponse.json({ success: true, items });

      case 'expandFolder':
        const children = await wixService.expandFolder(path);
        return NextResponse.json({ success: true, children });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Wix operation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
