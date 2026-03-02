import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

export type KylrixApp = 'root' | 'vault' | 'flow' | 'note' | 'connect';

interface LogoProps {
  sx?: any;
  size?: number;
  app?: KylrixApp;
  variant?: 'full' | 'icon';
  component?: any;
  href?: string;
}

const pulse = keyframes`
  0% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
  100% { opacity: 0.4; transform: scale(1); }
`;

const flowOffset = keyframes`
  0% { stroke-dashoffset: 200; }
  100% { stroke-dashoffset: 0; }
`;

const LogoContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  transition: 'all 0.3s ease',
  textDecoration: 'none'
});

const Logo: React.FC<LogoProps> = ({ 
  sx, 
  size = 40, 
  app = 'vault', 
  variant = 'full',
  component,
  href
}) => {
  const configs = {
    root: { color1: "#00F5FF", color2: "#00A3FF", name: "KYLRIX", desc: "Ecosystem Hub" },
    vault: { color1: "#00F5FF", color2: "#3B82F6", name: "VAULT", desc: "Zero-Knowledge Storage" },
    flow: { color1: "#00F5FF", color2: "#00FF94", name: "FLOW", desc: "AI Orchestration" },
    note: { color1: "#00F5FF", color2: "#A855F7", name: "NOTE", desc: "Structured Intelligence" },
    connect: { color1: "#00F5FF", color2: "#F43F5E", name: "CONNECT", desc: "P2P Encryption" }
  };

  const current = configs[app];

  return (
    <LogoContainer sx={sx} component={component} href={href}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`grad-${app}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={current.color1} />
            <stop offset="100%" stopColor={current.color2} />
          </linearGradient>
          <filter id="glow-heavy"><feGaussianBlur stdDeviation="4" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
        </defs>

        {app === 'vault' && (
          <>
            <rect x="25" y="15" width="12" height="70" rx="4" fill={`url(#grad-${app})`} />
            <path d="M75 15L45 50L75 85" stroke={current.color2} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            <path d="M85 25L55 50L85 75" stroke={current.color1} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ animation: `${pulse} 3s infinite ease-in-out` }} />
          </>
        )}
        
        {app !== 'vault' && (
           <g>
             <path d="M30 20V80" stroke={`url(#grad-${app})`} strokeWidth="10" strokeLinecap="round" />
             <path d="M70 20L35 50L70 80" stroke={`url(#grad-${app})`} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
             <circle cx="35" cy="50" r="5" fill="#fff" />
           </g>
        )}
      </svg>
      {variant === 'full' && (
        <Box>
          <Typography sx={{ fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', fontSize: `${size * 0.7}px`, lineHeight: 1, textTransform: 'uppercase', fontFamily: 'inherit' }}>
            {current.name}
          </Typography>
        </Box>
      )}
    </LogoContainer>
  );
};

export default Logo;
