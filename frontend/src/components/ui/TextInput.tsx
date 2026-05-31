import { InputHTMLAttributes, forwardRef } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const TextInput = forwardRef<HTMLInputElement, Props>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
    {...props}
  />
));

TextInput.displayName = 'TextInput';
export default TextInput;
