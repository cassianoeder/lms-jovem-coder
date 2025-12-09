import React from 'react';

const LoadingPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        <p className="text-lg text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
};

export default LoadingPage;