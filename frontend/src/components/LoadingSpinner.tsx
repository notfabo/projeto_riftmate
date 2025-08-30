import React from 'react';
import { Loading } from '../assets/index'

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Carregando..." }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <img 
        src={Loading} 
        alt="Animação de carregamento do League of Legends" 
        className="w-24 h-24"
      />
      <p className="text-xl text-yellow-400 font-semibold animate-pulse">
        {message}
      </p>
    </div>
  );
};