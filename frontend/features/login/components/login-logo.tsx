import Image from 'next/image';

export function LoginLogo() {
  return (
    <div className="flex items-center justify-center gap-10 mb-8">
      <Image 
        src="/favicon.png" 
        alt="Tomosigoto Logo" 
        width={56} 
        height={56} 
      />
      <div className="flex flex-col">
        <h1 
          className="text-[25px] text-[#d5a641] font-serif leading-tight"
          style={{ fontFamily: 'Crimson Text, serif', textShadow: '0px 2px 2px rgba(0,0,0,0.25)' }}
        >
          Tomosigoto
        </h1>
        <h2 
          className="text-[25px] text-[#d5a641] font-serif leading-tight ml-12"
          style={{ fontFamily: 'Crimson Text, serif', textShadow: '0px 2px 2px rgba(0,0,0,0.25)' }}
        >
          能 system
        </h2>
      </div>
    </div>
  );
}