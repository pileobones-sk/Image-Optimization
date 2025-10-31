import React from 'react';

const Spinner: React.FC<{ size?: string; text?: string }> = ({ size = 'h-8 w-8', text }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        className={`${size} animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]`}
        role="status"
      >
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
          Loading...
        </span>
      </div>
      {text && <p className="text-sm text-gray-400 animate-pulse">{text}</p>}
    </div>
  );
};

export default Spinner;
