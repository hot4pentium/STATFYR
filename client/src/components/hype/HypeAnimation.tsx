import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import fireLogo from "@/assets/statfyr-fire-logo.png";

interface HypeAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
  size?: "sm" | "md" | "lg";
}

export function HypeAnimation({ isVisible, onComplete, size = "md" }: HypeAnimationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-20 w-20",
    lg: "h-32 w-32",
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1.2, 1.1, 0.8],
          }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ 
            duration: 1,
            times: [0, 0.2, 0.5, 1],
            ease: "easeOut"
          }}
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(255,140,0,0.6) 0%, rgba(255,69,0,0.3) 50%, transparent 70%)",
                filter: "blur(20px)",
              }}
              animate={{
                scale: [1, 1.5, 1.2],
                opacity: [0.8, 1, 0],
              }}
              transition={{ duration: 1 }}
            />
            <motion.img
              src={fireLogo}
              alt="HYPE!"
              className={`${sizeClasses[size]} object-contain drop-shadow-[0_0_20px_rgba(255,140,0,0.8)]`}
              animate={{
                filter: [
                  "drop-shadow(0 0 10px rgba(255,140,0,0.5))",
                  "drop-shadow(0 0 30px rgba(255,140,0,1))",
                  "drop-shadow(0 0 20px rgba(255,140,0,0.7))",
                  "drop-shadow(0 0 5px rgba(255,140,0,0.3))",
                ],
              }}
              transition={{ duration: 1, times: [0, 0.3, 0.6, 1] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface HypeBurstProps {
  count: number;
  onComplete?: () => void;
}

export function HypeBurst({ count, onComplete }: HypeBurstProps) {
  const [bursts, setBursts] = useState<number[]>([]);

  useEffect(() => {
    if (count > 0) {
      const newBursts = Array.from({ length: Math.min(count, 5) }, (_, i) => Date.now() + i);
      setBursts(newBursts);
      
      const timer = setTimeout(() => {
        setBursts([]);
        onComplete?.();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [count, onComplete]);

  return (
    <AnimatePresence>
      {bursts.map((id, index) => (
        <motion.div
          key={id}
          className="absolute pointer-events-none z-50"
          style={{
            left: `${30 + Math.random() * 40}%`,
            top: `${20 + Math.random() * 40}%`,
          }}
          initial={{ opacity: 0, scale: 0, y: 0 }}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.3, 1, 0.5],
            y: [0, -50 - index * 10, -80],
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 0.8,
            delay: index * 0.1,
            ease: "easeOut"
          }}
        >
          <img
            src={fireLogo}
            alt=""
            className="h-10 w-10 object-contain drop-shadow-[0_0_15px_rgba(255,140,0,0.8)]"
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
