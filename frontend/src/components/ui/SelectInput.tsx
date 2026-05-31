import { SelectHTMLAttributes } from 'react';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

export default function SelectInput({ className = '', children, ...props }: Props) {
  return (
    <select
      className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
