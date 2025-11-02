import { NextRequest, NextResponse } from 'next/server';
import { wordpressService } from '@/lib/services/wordpressService';
import type { WordPressConnection } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { action, config, path, content, postId, pageId } = await request.json();

    switch (action) {
      case 'connect':
        await wordpressService.connect(config as WordPressConnection);
        return NextResponse.json({ success: true, message: 'Connected successfully' });

      case 'disconnect':
        await wordpressService.disconnect();
        return NextResponse.json({ success: true, message: 'Disconnected successfully' });

      case 'getTree':
        const tree = await wordpressService.getFileTree();
        return NextResponse.json({ success: true, tree });

      case 'getContent':
        const fileContent = await wordpressService.getFileContent(path);
        return NextResponse.json({ success: true, content: fileContent });

      case 'updateContent':
        await wordpressService.updateFileContent(path, content);
        return NextResponse.json({ success: true, message: 'Content updated successfully' });

      case 'getPosts':
        const posts = await wordpressService.getPosts({ per_page: 100 });
        return NextResponse.json({ success: true, posts });

      case 'getPages':
        const pages = await wordpressService.getPages({ per_page: 100 });
        return NextResponse.json({ success: true, pages });

      case 'getPost':
        const post = await wordpressService.getPost(postId);
        return NextResponse.json({ success: true, post });

      case 'getPage':
        const page = await wordpressService.getPage(pageId);
        return NextResponse.json({ success: true, page });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('WordPress operation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
