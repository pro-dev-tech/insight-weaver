import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MoneyRainProps {
  active: boolean;
  duration?: number;
}

export function MoneyRain({ active, duration = 3000 }: MoneyRainProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; delay: number; size: number }[]>([]);

  useEffect(() => {
    if (!active) { setParticles([]); return; }
    const p = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      size: 14 + Math.random() * 10,
    }));
    setParticles(p);
    const timer = setTimeout(() => setParticles([]), duration);
    return () => clearTimeout(timer);
  }, [active, duration]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: -60, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
              animate={{ y: "110vh", opacity: [1, 1, 0.5], rotate: Math.random() * 360 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5 + Math.random(), delay: p.delay, ease: "easeIn" }}
              className="absolute text-accent font-bold select-none"
              style={{ fontSize: p.size }}
            >
              ₹
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
