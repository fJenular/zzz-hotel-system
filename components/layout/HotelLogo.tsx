import Image from 'next/image'

interface HotelLogoProps {
  variant?: 'light' | 'dark'
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function HotelLogo({
  variant = 'light',
  showText = true,
  size = 'md',
  className = ''
}: HotelLogoProps) {
  const sizes = {
    sm: { img: 32, text: 'text-base' },
    md: { img: 40, text: 'text-xl' },
    lg: { img: 52, text: 'text-2xl' },
  }

  const { img, text } = sizes[size]

  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/Zzz.svg"
        alt="ZZZ Hotel Logo"
        width={img}
        height={img}
        className="object-contain"
        priority
      />
      {showText && (
        <span
          className={`${text} font-bold tracking-tight ${
            variant === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          ZZZ HOTEL
        </span>
      )}
    </span>
  )
}

export default HotelLogo
