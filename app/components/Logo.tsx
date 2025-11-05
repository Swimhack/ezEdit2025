interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'default' | 'light' | 'dark' | 'nav'
  showText?: boolean
}

export default function Logo({ size = 'md', className = '', variant = 'default', showText = false }: LogoProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl'
  }

  const iconSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16'
  }

  // 3D embossed style matching the design
  const embossedStyle: React.CSSProperties = {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    display: 'inline-flex',
    alignItems: 'center',
    textRendering: 'optimizeLegibility' as const,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale'
  }

  // 3D embossed shadow for "Ez" (light/white)
  const getEzShadow = (isLight: boolean) => {
    if (isLight) {
      // Light variant: white text on dark background - stronger shadows for depth
      return '3px 3px 8px rgba(0,0,0,0.5), 1px 1px 2px rgba(0,0,0,0.3), -1px -1px 3px rgba(255,255,255,0.25), 0 0 12px rgba(255,255,255,0.2)'
    } else {
      // Dark variant: dark text on light background - embossed effect
      return '2px 2px 5px rgba(0,0,0,0.3), 1px 1px 1px rgba(0,0,0,0.2), -1px -1px 2px rgba(255,255,255,0.95), 0 0 8px rgba(0,0,0,0.2)'
    }
  }

  // 3D embossed shadow for "Edit" (blue) - vibrant blue with depth
  const editShadow = '3px 3px 8px rgba(0,0,0,0.5), 1px 1px 2px rgba(0,0,0,0.3), -1px -1px 3px rgba(59,130,246,0.5), 0 0 12px rgba(59,130,246,0.3)'

  if (variant === 'nav') {
    // Nav variant uses dark text by default (for light backgrounds)
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {showText ? (
          <div style={embossedStyle} className={sizeClasses[size] || 'text-6xl'}>
            <span 
              style={{
                color: '#1f2937',
                textShadow: getEzShadow(false),
                display: 'inline-block',
                paddingRight: '0.05em'
              }}
            >
              Ez
            </span>
            <span 
              style={{
                color: '#3b82f6',
                textShadow: editShadow,
                display: 'inline-block'
              }}
            >
              Edit
            </span>
          </div>
        ) : (
          <div className="bg-blue-600 rounded-lg p-3 flex items-center justify-center shadow-md">
            <span 
              style={{
                color: '#ffffff',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3), -1px -1px 1px rgba(255,255,255,0.2)',
                fontWeight: 700,
                fontSize: '3rem'
              }}
            >
              Ez
            </span>
          </div>
        )}
      </div>
    )
  }

  const isLight = variant === 'light'
  const ezColor = isLight ? '#ffffff' : '#1f2937'

  return (
    <div 
      style={embossedStyle}
      className={`${sizeClasses[size]} ${className}`}
    >
      <span 
        style={{
          color: ezColor,
          textShadow: getEzShadow(isLight),
          display: 'inline-block',
          paddingRight: '0.05em'
        }}
      >
        Ez
      </span>
      <span 
        style={{
          color: '#3b82f6',
          textShadow: editShadow,
          display: 'inline-block'
        }}
      >
        Edit
      </span>
    </div>
  )
}