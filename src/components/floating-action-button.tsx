import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="floating-button hover:animate-telegram-bounce"
    >
      <Plus size={24} />
    </button>
  );
}
