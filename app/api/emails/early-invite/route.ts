import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { to, name, inviteCode } = await request.json()
    if (!to) return NextResponse.json({ error: 'Missing to' }, { status: 400 })

    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.FROM_EMAIL || 'noreply@ezedit.co'
    if (!apiKey) return NextResponse.json({ error: 'Server missing RESEND_API_KEY' }, { status: 500 })

    const subject = 'You’re in: Early Invite Access to EzEdit.co'
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Welcome${name ? ', ' + String(name) : ''}!</h2>
        <p>You now have early invite access to EzEdit.co.</p>
        ${inviteCode ? `<p><strong>Your invite code:</strong> ${String(inviteCode)}</p>` : ''}
        <p><a href="https://ezedit.co" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Open EzEdit.co</a></p>
        <p style="color:#555;font-size:12px">If you didn’t request this, you can ignore this email.</p>
      </div>
    `
    const payload = { from: fromEmail, to: [to], subject, html }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: result?.message || 'Resend error', detail: result }, { status: 502 })
    }

    return NextResponse.json({ success: true, id: result?.id || result?.data?.id || null })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 })
  }
}



