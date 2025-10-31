import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  icon: 'upload' | 'sparkles' | 'image' | 'video' | 'search' | 'check' | 'warning' | 'edit' | 'download' | 'folder' | 'location';
}

const paths: Record<IconProps['icon'], string> = {
  upload: "M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8m-4-6l-4-4-4 4m4-4v12",
  sparkles: "M10 3L8 8L3 10L8 12L10 17L12 12L17 10L12 8L10 3Z",
  image: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM5 15l3.5-3.5a1.5 1.5 0 012.12 0L14 15m-4-4l-1 1",
  video: "M15 10l4.55-3.27A1 1 0 0121 7.54v9.92a1 1 0 01-1.45.83L15 15V10zM3 5a2 2 0 012-2h8a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z",
  search: "M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z",
  check: "M20 6L9 17l-5-5",
  warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7m-5-6l-4 4v3h3l4-4-3-3z",
  download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  folder: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  location: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 12a3 3 0 100-6 3 3 0 000 6z",
};

const Icon: React.FC<IconProps> = ({ icon, className, ...props }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg"
      className={className || "h-6 w-6"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[icon]} />
    </svg>
  );
};

export default Icon;
