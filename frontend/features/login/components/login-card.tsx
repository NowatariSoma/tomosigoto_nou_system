interface LoginCardProps {
  children: React.ReactNode;
}

export function LoginCard({ children }: LoginCardProps) {
  return (
    <div className="relative z-10 w-full max-w-[360px] h-[390px] flex items-center justify-center" style={{ transform: 'scale(1)' }}>
      {/* Glass morphism card background */}
      <div 
        className="absolute inset-0 backdrop-blur-md"
        style={{
          borderRadius: '98px 16px 98px 16px',
          background: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '30px 18px 35px 0px rgba(0,0,0,0.6)'
        }}
      />
      
      {/* Gradient border - using pseudo element approach */}
      <div 
        className="absolute inset-0"
        style={{
          borderRadius: '98px 16px 98px 16px',
          background: 'linear-gradient(180deg, #F54D4F 0%, #D5A641 50%)',
          padding: '2px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none'
        }}
      />
      
      {/* Form content */}
      <div className="relative z-10 w-full px-14 py-8">
        {children}
      </div>
    </div>
  );
}