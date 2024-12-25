import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="absolute top-4 left-4 w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg"
    >
      <ArrowLeft className="h-6 w-6 text-white" />
    </button>
  );
}