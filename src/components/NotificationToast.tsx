import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Bell } from 'lucide-react';

interface NotificationToastProps {
  notification: {
    id: string;
    title: string;
    message: string;
    groupId: string;
    avatar?: string;
  } | null;
  onClose: () => void;
  onClick: (groupId: string) => void;
}

export function NotificationToast({ notification, onClose, onClick }: NotificationToastProps) {
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeStartX, setSwipeStartX] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!notification) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const offset = currentX - swipeStartX;
    if (Math.abs(offset) > 0) {
      setSwipeOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (Math.abs(swipeOffset) > 100) {
      onClose();
    }
    setIsSwiping(false);
    setSwipeOffset(0);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1, x: swipeOffset }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-6 left-4 right-4 z-[10000] flex justify-center pointer-events-none"
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => onClick(notification.groupId)}
          className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 flex items-center gap-4 shadow-2xl max-w-md w-full pointer-events-auto cursor-pointer group active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#0D98BA]/20 flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
            {notification.avatar ? (
              <img src={notification.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <Bell className="text-[#0D98BA]" size={24} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-black uppercase text-[10px] tracking-widest mb-0.5 line-clamp-1">{notification.title}</h4>
            <p className="text-zinc-400 text-xs line-clamp-2 leading-tight">{notification.message}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 hover:bg-white/10 rounded-xl text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
