import { NextRequest, NextResponse } from 'next/server'
import { Client as FTPClient } from 'basic-ftp'
import { getWebsite } from '@/lib/websites-memory-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { websiteId } = body
    const userId = 'demo-user'

    if (!websiteId) {
      return NextResponse.json({ error: 'websiteId is required' }, { status: 400 })
    }

    const website = getWebsite(userId, websiteId)
    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 })
    }

    const results: any[] = []

    // Test 1: Standard FTP
    console.log('Test 1: Standard FTP')
    try {
      const client1 = new FTPClient()
      client1.ftp.verbose = true
      
      await client1.access({
        host: website.host.trim(),
        port: parseInt(website.port, 10) || 21,
        user: website.username,
        password: website.password,
        secure: false,
        connTimeout: 10000,
        pasvTimeout: 5000
      })
      
      const pwd1 = await client1.pwd()
      const list1 = await client1.list('/')
      
      results.push({
        method: 'FTP (Standard)',
        success: true,
        currentDir: pwd1,
        fileCount: list1.length,
        files: list1.slice(0, 5).map((f: any) => f.name)
      })
      
      await client1.close()
    } catch (error: any) {
      results.push({
        method: 'FTP (Standard)',
        success: false,
        error: error.message,
        code: error.code
      })
    }

    // Test 2: FTP with Explicit TLS (FTPS)
    if (website.port === '21' || website.port === '990') {
      console.log('Test 2: FTPS (Explicit TLS)')
      try {
        const client2 = new FTPClient()
        client2.ftp.verbose = true
        
        await client2.access({
          host: website.host.trim(),
          port: parseInt(website.port, 10) || 21,
          user: website.username,
          password: website.password,
          secure: true, // Explicit TLS
          connTimeout: 10000,
          pasvTimeout: 5000
        })
        
        const pwd2 = await client2.pwd()
        const list2 = await client2.list('/')
        
        results.push({
          method: 'FTPS (Explicit TLS)',
          success: true,
          currentDir: pwd2,
          fileCount: list2.length,
          files: list2.slice(0, 5).map((f: any) => f.name)
        })
        
        await client2.close()
      } catch (error: any) {
        results.push({
          method: 'FTPS (Explicit TLS)',
          success: false,
          error: error.message,
          code: error.code
        })
      }
    }

    // Test 3: Try different ports
    const portsToTry = [21, 990, 22]
    for (const port of portsToTry) {
      if (port === parseInt(website.port, 10)) continue // Skip already tested port
      
      console.log(`Test: Port ${port}`)
      try {
        const client3 = new FTPClient()
        client3.ftp.verbose = true
        
        await client3.access({
          host: website.host.trim(),
          port: port,
          user: website.username,
          password: website.password,
          secure: port === 990,
          connTimeout: 5000,
          pasvTimeout: 3000
        })
        
        const pwd3 = await client3.pwd()
        const list3 = await client3.list('/')
        
        results.push({
          method: `Port ${port} (${port === 990 ? 'FTPS' : 'FTP'})`,
          success: true,
          currentDir: pwd3,
          fileCount: list3.length,
          files: list3.slice(0, 5).map((f: any) => f.name)
        })
        
        await client3.close()
        break // Stop on first success
      } catch (error: any) {
        results.push({
          method: `Port ${port}`,
          success: false,
          error: error.message,
          code: error.code
        })
      }
    }

    const successful = results.find(r => r.success)
    
    return NextResponse.json({
      website: {
        host: website.host,
        port: website.port,
        username: website.username,
        type: website.type
      },
      results,
      recommendation: successful ? {
        method: successful.method,
        port: successful.port || website.port,
        secure: successful.method.includes('FTPS')
      } : null
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Test failed' },
      { status: 500 }
    )
  }
}

