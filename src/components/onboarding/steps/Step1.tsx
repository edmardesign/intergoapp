import React from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { Link } from '@tanstack/react-router';
import logoAsset from '@/assets/intergo_logo.png.asset.json';

export const Step1: React.FC = () => {
  const nextStep = useOnboardingStore((state) => state.nextStep);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="w-24 h-24 bg-white rounded-[20px] mb-8 flex items-center justify-center shadow-lg overflow-hidden p-2">
        <img src={logoAsset.url} alt="INTERGO Logo" className="w-full h-full object-contain" />
      </div>
      
      <h1 className="text-screen-title mb-4">INTERGO</h1>
      <p className="text-body text-secondary mb-12 max-w-[280px]">
        Comunicação direta e eficiente para a gestão pública.
      </p>

      <div className="fixed bottom-8 left-5 right-5">
        <button onClick={nextStep} className="btn-primary">
          Começar
        </button>
        <Link 
          to="/login" // Em um app real levaria para login
          className="block mt-6 text-body text-primary font-semibold"
        >
          Já tenho cadastro
        </Link>
      </div>
    </div>
  );
};
