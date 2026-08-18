import React from 'react';

export const GlassCard = ({
  children,
  className = '',
  glowColor = 'none',
  hoverEffect = true,
  onClick,
  id,
}) => {
  const glowClasses = {
    blue: 'hover:border-[#00684A] hover:shadow-[0_10px_25px_-5px_rgba(0,104,74,0.12)]',
    purple: 'hover:border-purple-400 hover:shadow-[0_10px_25px_-5px_rgba(147,51,234,0.12)]',
    emerald: 'hover:border-[#00ED64] hover:shadow-[0_10px_25px_-5px_rgba(0,237,100,0.2)]',
    amber: 'hover:border-amber-400 hover:shadow-[0_10px_25px_-5px_rgba(245,158,11,0.12)]',
    cyan: 'hover:border-teal-400 hover:shadow-[0_10px_25px_-5px_rgba(20,184,166,0.12)]',
    none: 'hover:border-[#00684A] hover:shadow-md hover:shadow-emerald-700/5',
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`
        bg-white/95 backdrop-blur-md border border-[#D1E2D7] rounded-2xl p-5 shadow-xs shadow-emerald-950/5
        transition-all duration-200 ease-out
        ${hoverEffect ? `${glowClasses[glowColor]} hover:-translate-y-0.5 cursor-pointer` : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
