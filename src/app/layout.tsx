import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EzEdit.co - AI-Powered Website Editor',
  description: 'Edit your website files directly with AI assistance. Connect via FTP/SFTP and update your code using natural language prompts.',
  keywords: ['website editor', 'FTP editor', 'AI coding assistant', 'online code editor', 'file editor'],
  authors: [{ name: 'EzEdit.co' }],
  openGraph: {
    title: 'EzEdit.co - AI-Powered Website Editor',
    description: 'Edit your website files directly with AI assistance',
    url: 'https://ezedit.co',
    siteName: 'EzEdit.co',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EzEdit.co - AI-Powered Website Editor',
    description: 'Edit your website files directly with AI assistance',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}