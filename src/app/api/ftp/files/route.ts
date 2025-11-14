import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

// Mock file system data for demo purposes
const mockFiles = [
  {
    id: '1',
    name: 'index.html',
    path: '/index.html',
    type: 'file' as const,
    size: 2048,
    modified: '2024-01-15T10:30:00Z',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to My Website</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>Welcome to My Website</h1>
        <nav>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section id="home">
            <h2>Home</h2>
            <p>This is the home section of my website.</p>
        </section>
        
        <section id="about">
            <h2>About</h2>
            <p>Learn more about us here.</p>
        </section>
        
        <section id="contact">
            <h2>Contact</h2>
            <p>Get in touch with us.</p>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 My Website. All rights reserved.</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>`,
    language: 'html'
  },
  {
    id: '2',
    name: 'styles.css',
    path: '/styles.css',
    type: 'file' as const,
    size: 1024,
    modified: '2024-01-14T15:45:00Z',
    content: `/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
}

/* Header styles */
header {
    background-color: #2c3e50;
    color: white;
    padding: 1rem 0;
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
}

header h1 {
    text-align: center;
    margin-bottom: 0.5rem;
}

nav ul {
    list-style: none;
    display: flex;
    justify-content: center;
}

nav li {
    margin: 0 1rem;
}

nav a {
    color: white;
    text-decoration: none;
    transition: color 0.3s ease;
}

nav a:hover {
    color: #3498db;
}

/* Main content */
main {
    margin-top: 120px;
    padding: 2rem;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
}

section {
    background: white;
    margin-bottom: 2rem;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h2 {
    color: #2c3e50;
    margin-bottom: 1rem;
}

/* Footer */
footer {
    background-color: #34495e;
    color: white;
    text-align: center;
    padding: 1rem 0;
    margin-top: 2rem;
}`,
    language: 'css'
  },
  {
    id: '3',
    name: 'script.js',
    path: '/script.js',
    type: 'file' as const,
    size: 512,
    modified: '2024-01-13T09:20:00Z',
    content: `// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add active class to current section
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('nav a');
        
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            if (pageYOffset >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
    });
    
    // Simple form validation (if contact form exists)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            if (!name || !email || !message) {
                alert('Please fill in all fields');
                return;
            }
            
            // Simulate form submission
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
        });
    }
});

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Fade in animation for sections
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });
    
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
});`,
    language: 'javascript'
  },
  {
    id: '4',
    name: 'images',
    path: '/images',
    type: 'directory' as const,
    size: 0,
    modified: '2024-01-12T14:10:00Z',
    children: [
      {
        id: '5',
        name: 'logo.png',
        path: '/images/logo.png',
        type: 'file' as const,
        size: 15360,
        modified: '2024-01-12T14:05:00Z',
        content: '',
        language: 'image',
        parent_id: '4'
      },
      {
        id: '6',
        name: 'hero-bg.jpg',
        path: '/images/hero-bg.jpg',
        type: 'file' as const,
        size: 204800,
        modified: '2024-01-12T14:08:00Z',
        content: '',
        language: 'image',
        parent_id: '4'
      }
    ]
  }
]

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connectionId')
    const path = searchParams.get('path') || '/'

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      )
    }

    // Verify user owns this connection
    const { data: connection } = await supabase
      .from('ftp_connections')
      .select('id')
      .eq('id', connectionId)
      .eq('user_id', session.user.id)
      .single()

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    // For demo purposes, return mock files
    // In a real implementation, you would:
    // 1. Connect to the FTP server using stored credentials
    // 2. List files in the specified path
    // 3. Return the file structure

    let files = mockFiles
    if (path !== '/') {
      // Filter files for specific path
      const parentDir = mockFiles.find(f => f.path === path && f.type === 'directory')
      files = parentDir?.children || []
    }

    return NextResponse.json({
      success: true,
      files,
      path
    })

  } catch (error) {
    console.error('FTP Files API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { connectionId, filePath, content, action = 'write' } = await request.json()

    if (!connectionId || !filePath) {
      return NextResponse.json(
        { error: 'Connection ID and file path are required' },
        { status: 400 }
      )
    }

    // Verify user owns this connection
    const { data: connection } = await supabase
      .from('ftp_connections')
      .select('id')
      .eq('id', connectionId)
      .eq('user_id', session.user.id)
      .single()

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    // For demo purposes, simulate file operations
    // In a real implementation, you would:
    // 1. Connect to the FTP server
    // 2. Perform the requested operation (read, write, delete)
    // 3. Return the result

    if (action === 'read') {
      // Find the file in mock data
      const file = mockFiles.find(f => f.path === filePath && f.type === 'file')
      if (!file) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        content: file.content,
        path: filePath,
        size: file.size,
        modified: file.modified
      })
    }

    if (action === 'write') {
      if (content === undefined) {
        return NextResponse.json(
          { error: 'Content is required for write operation' },
          { status: 400 }
        )
      }

      // Validate file type and size for hero image uploads
      if (filePath.includes('hero-image')) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(content.type) || content.size > maxSize) {
          return NextResponse.json(
            { error: 'Invalid file type or size' },
            { status: 400 }
          );
        }
      }

      // Save edit history
      await supabase
        .from('edit_history')
        .insert({
          user_id: session.user.id,
          connection_id: connectionId,
          file_path: filePath,
          content,
          change_type: 'update',
          file_size: content.length,
          language: getLanguageFromPath(filePath)
        })

      return NextResponse.json({
        success: true,
        message: 'File saved successfully',
        path: filePath,
        size: content.length
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('FTP File Operation API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getLanguageFromPath(filePath: string): string | null {
  const ext = filePath.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    html: 'html',
    css: 'css',
    js: 'javascript',
    php: 'php',
    py: 'python',
    rb: 'ruby',
  }
  return languageMap[ext || ''] || null
}