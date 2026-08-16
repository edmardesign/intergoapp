import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

interface SendFlowLayoutProps {
  step: 1 | 2 | 3;
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const SendFlowLayout: React.FC<SendFlowLayoutProps> = ({ 
  step, 
  title, 
  onBack, 
  children,
  footer 
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-background">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div 
          className="h-full bg-primary transition-all duration-300" 
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="p-4 flex items-center pt-8">
        <button 
          onClick={onBack || (() => navigate({ to: '/enviar' }))}
          className="p-2 -ml-2 text-primary"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold ml-2">{title}</h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 pb-32">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="fixed bottom-[56px] left-0 right-0 p-6 bg-background/80 backdrop-blur-md border-t border-border">
          {footer}
        </div>
      )}
    </div>
  );
};
