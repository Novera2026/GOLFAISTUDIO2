
import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageSlotProps {
  label: string;
  description?: string;
  images: string[];
  onUpload: (files: FileList) => void;
  maxImages?: number;
}

export const ImageSlot: React.FC<ImageSlotProps> = ({ 
  label, 
  description, 
  images, 
  onUpload,
  maxImages = 1 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-black shadow-sm">
          !
        </div>
        <div>
          <h3 className="text-xs font-black text-emerald-950 uppercase tracking-[0.2em] leading-none mb-1">{label}</h3>
          {description && <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{description}</p>}
        </div>
      </div>
      
      <motion.div 
        whileHover={{ scale: 1.02, borderColor: 'rgb(16, 185, 129)' }}
        whileTap={{ scale: 0.98 }}
        className="relative min-h-[220px] rounded-[2rem] border-2 border-dashed border-emerald-100 bg-emerald-50/20 flex flex-col items-center justify-center cursor-pointer transition-all p-6 group overflow-hidden"
        onClick={handleClick}
      >
        <AnimatePresence mode="wait">
          {images.length > 0 ? (
            <motion.div 
              key="images"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className={`grid ${images.length > 4 ? 'grid-cols-3' : images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-3 w-full h-full`}
            >
              {images.map((img, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative aspect-square overflow-hidden rounded-2xl shadow-xl border-4 border-white"
                >
                  <img 
                    src={img} 
                    alt={`Uploaded ${idx}`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              ))}
              <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-500 rounded-[2rem] backdrop-blur-[2px] pointer-events-none">
                 <span className="bg-white px-6 py-2.5 rounded-full text-[10px] font-black text-emerald-900 shadow-2xl tracking-widest uppercase transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                   REPLACE ASSETS
                 </span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 mb-6 flex items-center justify-center rounded-3xl bg-white shadow-2xl shadow-emerald-200/50 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-emerald-900 font-black text-[10px] tracking-[0.3em] uppercase">Tải Ảnh Tài Nguyên</p>
              <p className="text-gray-400 text-[9px] mt-2 font-bold uppercase tracking-widest opacity-60">Drag & Drop or Click</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <input 
        type="file" 
        multiple={maxImages > 1} 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};
