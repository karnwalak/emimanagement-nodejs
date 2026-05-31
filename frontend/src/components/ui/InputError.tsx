interface Props {
  message?: string;
  className?: string;
}

export default function InputError({ message, className = '' }: Props) {
  if (!message) return null;
  return <p className={`text-sm text-red-600 mt-1 ${className}`}>{message}</p>;
}
