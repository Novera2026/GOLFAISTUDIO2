
import React from 'react';
import { motion } from 'motion/react';

interface DNACheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: string;
}

export const DNACheckbox: React.FC<DNACheckboxProps> = ({ 
  label, 
  checked, 
  onChange,
  color = 'bg-emerald-600' 
}) => {
  return (
    <label className="flex items-center space-x-4 cursor-pointer group select-none">
      <motion.div 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
          checked ? `${color} border-transparent shadow-lg shadow-emerald-100` : 'border-gray-200 bg-white'
        }`}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <motion.svg 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-4 h-4 text-white" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
          </motion.svg>
        )}
      </motion.div>
      <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${
        checked ? 'text-emerald-950' : 'text-gray-400 group-hover:text-emerald-600'
      }`}>
        {label}
      </span>
    </label>
  );
};
