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
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="bg-blue-600 rounded-lg p-2 flex items-center justify-center">
          <span className="text-white font-bold text-lg">Ez</span>
        </div>
        {showText && (
          <span className="font-semibold text-xl text-gray-900">EzEdit.co</span>
        )}
      </div>
    )
  }

  const ezColor = variant === 'light' ? 'text-white' : variant === 'dark' ? 'text-gray-900' : 'text-gray-800'

  return (
    <div className={`font-bold tracking-tight ${sizeClasses[size]} ${className}`}>
      <span className={ezColor}>Ez</span>
      <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
        Edit
      </span>
    </div>
  )
}