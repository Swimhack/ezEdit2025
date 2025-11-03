interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'default' | 'light' | 'dark' | 'nav'
  showText?: boolean
}

export default function Logo({ size = 'md', className = '', variant = 'default', showText = false }: LogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  }

  const iconSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16'
  }

  if (variant === 'nav') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {showText ? (
          <div 
            className={`font-bold tracking-tight ${sizeClasses[size] || 'text-3xl'}`}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <span 
              style={{
                color: variant === 'light' ? '#ffffff' : '#1f2937',
                textShadow: variant === 'light'
                  ? '2px 2px 4px rgba(0,0,0,0.3), -1px -1px 2px rgba(255,255,255,0.2), 0 0 8px rgba(255,255,255,0.1)'
                  : '2px 2px 4px rgba(0,0,0,0.2), -1px -1px 1px rgba(255,255,255,0.8), 0 0 4px rgba(0,0,0,0.1)',
                display: 'inline-block'
              }}
            >
              Ez
            </span>
            <span 
              style={{
                color: '#3b82f6',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3), -1px -1px 2px rgba(59,130,246,0.3), 0 0 8px rgba(59,130,246,0.1)',
                display: 'inline-block',
                marginLeft: '0.1em'
              }}
            >
              Edit
            </span>
          </div>
        ) : (
          <div className="bg-blue-600 rounded-lg p-3 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-2xl">Ez</span>
          </div>
        )}
      </div>
    )
  }

  const ezColor = variant === 'light' ? '#ffffff' : '#1f2937'

  return (
    <div 
      className={`font-bold tracking-tight ${sizeClasses[size]} ${className}`}
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        display: 'inline-flex',
        alignItems: 'center'
      }}
    >
      <span 
        style={{
          color: ezColor,
          textShadow: variant === 'light' 
            ? '2px 2px 4px rgba(0,0,0,0.3), -1px -1px 2px rgba(255,255,255,0.2), 0 0 8px rgba(255,255,255,0.1)'
            : '2px 2px 4px rgba(0,0,0,0.2), -1px -1px 1px rgba(255,255,255,0.8), 0 0 4px rgba(0,0,0,0.1)',
          display: 'inline-block'
        }}
      >
        Ez
      </span>
      <span 
        style={{
          color: '#3b82f6',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3), -1px -1px 2px rgba(59,130,246,0.3), 0 0 8px rgba(59,130,246,0.1)',
          display: 'inline-block',
          marginLeft: '0.1em'
        }}
      >
        Edit
      </span>
    </div>
  )
}