import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-emerald-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[250px]">
        <CheckCircle size={20} className="flex-shrink-0" />
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}


