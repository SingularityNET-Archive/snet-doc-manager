import React from 'react';

interface LoadingBarProps {
  progress: number;
}

const LoadingBar: React.FC<LoadingBarProps> = ({ progress }) => {
  const containerStyle = {
    width: '100%',
    backgroundColor: 'black',
    borderRadius: '8px',
    margin: '15px 0',
    padding: '3px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
  };

  const progressStyle = {
    width: `${progress}%`,
    backgroundColor: '#4CAF50',
    height: '20px',
    borderRadius: '6px',
    transition: 'width 0.3s ease-in-out',
    boxShadow: '0 0 5px rgba(0, 0, 0, 0.2)',
  };

  const textStyle = {
    textAlign: 'center' as const,
    marginTop: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ffffff',
  };

  return (
    <div style={containerStyle}>
      <div style={progressStyle} />
      <div style={textStyle}>
        {`${Math.round(progress)}%`}
      </div>
    </div>
  );
};

export default LoadingBar;