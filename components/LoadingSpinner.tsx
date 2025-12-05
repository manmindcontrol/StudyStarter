import { Loader2 } from "lucide-react";

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
};

export default function LoadingSpinner({
  size = "md",
  text,
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-current`} />
      {text && <span className="text-sm font-medium">{text}</span>}
    </div>
  );
}
