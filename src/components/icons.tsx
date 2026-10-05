import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

/** NexaTelix mark: a single-line N whose last stroke stops short of a lime "delivered" dot. */
export const Logo = (p: P) => (
  <svg viewBox="0 0 64 64" fill="none" aria-hidden {...p}>
    <path d="M18 46V18l28 28V30" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="46" cy="17" r="5.5" fill="#c6ff3d" />
  </svg>
);

export const Arrow = (p: P) => (
  <svg viewBox="0 0 16 16" fill="none" className="arrow" {...p}>
    <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowUR = (p: P) => (
  <svg viewBox="0 0 16 16" fill="none" width="18" height="18" {...p}>
    <path d="M4 12L12 4M5 4h7v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Verified = (p: P) => (
  <svg viewBox="0 0 16 16" width="14" height="14" {...p}>
    <path
      d="M8 .8l1.9 1.4 2.3-.1.7 2.2 1.9 1.4-.7 2.3.7 2.2-1.9 1.4-.7 2.2-2.3-.1L8 15.2l-1.9-1.4-2.3.1-.7-2.2L1.2 10.3l.7-2.2-.7-2.3 1.9-1.4.7-2.2 2.3.1z"
      fill="#3a8bf0"
    />
    <path d="M5.2 8.1l1.9 1.8 3.7-3.8" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const I = ({ d, ...p }: P & { d: string }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d={d} />
  </svg>
);

export const Icon = {
  shield: (p: P) => <I {...p} d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3zM8.5 12l2.5 2.5 4.5-5" />,
  bolt: (p: P) => <I {...p} d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  route: (p: P) => <I {...p} d="M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM6 15V9a4 4 0 014-4h6M18 9v6a4 4 0 01-4 4H8" />,
  globe: (p: P) => <I {...p} d="M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />,
  chart: (p: P) => <I {...p} d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  code: (p: P) => <I {...p} d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />,
  image: (p: P) => <I {...p} d="M4 5h16v14H4zM4 15l4.5-4.5 4 4L15 12l5 5M15.5 9a1 1 0 100-2 1 1 0 000 2z" />,
  cursor: (p: P) => <I {...p} d="M5 3l14 7-6 2-2 6L5 3z" />,
  eye: (p: P) => <I {...p} d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z" />,
  user: (p: P) => <I {...p} d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" />,
  key: (p: P) => <I {...p} d="M15 9a4 4 0 11-8 0 4 4 0 018 0zM13.8 11.8L21 19v2h-3v-2h-2v-2h-2l-.2-.2" />,
  bell: (p: P) => <I {...p} d="M6 16V11a6 6 0 1112 0v5l2 2H4l2-2zM10 21h4" />,
  repeat: (p: P) => <I {...p} d="M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3" />,
  clock: (p: P) => <I {...p} d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2" />,
  wallet: (p: P) => <I {...p} d="M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 0V6a2 2 0 012-2h11M17 13.5h.01" />,
  send: (p: P) => <I {...p} d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z" />,
  grid: (p: P) => <I {...p} d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
  life: (p: P) => <I {...p} d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6" />,
  logout: (p: P) => <I {...p} d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l5-5-5-5M15 12H3" />,
  users: (p: P) => <I {...p} d="M9 11a4 4 0 100-8 4 4 0 000 8zM2 21a7 7 0 0114 0M16 3.5a4 4 0 010 7.5M22 21a7 7 0 00-4-6.3" />,
  tag: (p: P) => <I {...p} d="M3 12V4a1 1 0 011-1h8l9 9-9 9-9-9zM8 8h.01" />,
  inbox: (p: P) => <I {...p} d="M3 13l3-8h12l3 8v6H3v-6zm0 0h5l1 3h6l1-3h5" />,
  settings: (p: P) => <I {...p} d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" />,
  plus: (p: P) => <I {...p} d="M12 5v14M5 12h14" />,
  download: (p: P) => <I {...p} d="M12 3v12M7 10l5 5 5-5M4 21h16" />,
  upload: (p: P) => <I {...p} d="M12 21V9M7 14l5-5 5 5M4 3h16" />,
  lock: (p: P) => <I {...p} d="M5 11h14v10H5zM8 11V7a4 4 0 118 0v4" />,
  dice: (p: P) => <I {...p} d="M4 4h16v16H4zM8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" />,
  telegram: (p: P) => <I {...p} d="M21 4L3 11l6 2 2 6 3-4 5 4 2-15zM9 13l9-6" />,
  whatsapp: (p: P) => <I {...p} d="M4 20l1.3-4A8 8 0 1112 20a8 8 0 01-4-1l-4 1zM9 9c0 3 3 6 6 6l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2L9 9z" />,
  mail: (p: P) => <I {...p} d="M3 5h18v14H3zM3 6l9 7 9-7" />,
  linkedin: (p: P) => <I {...p} d="M4 9h3v11H4zM5.5 4.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 9h3v1.6c.6-1 1.8-1.8 3.4-1.8 2.6 0 3.6 1.6 3.6 4.4V20h-3v-6c0-1.4-.4-2.4-1.8-2.4S13 12.6 13 14v6h-3z" />,
  file: (p: P) => <I {...p} d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8l-5-5zM14 3v5h5M9 13h6M9 17h6" />,
  message: (p: P) => <I {...p} d="M4 5h16v11H8l-4 4V5zM8 9h8M8 12h5" />,
  history: (p: P) => <I {...p} d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8M3 3v5h5M12 7v5l3 2" />,
  pin: (p: P) => <I {...p} d="M12 21s-7-6-7-11a7 7 0 1114 0c0 5-7 11-7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />,
};
