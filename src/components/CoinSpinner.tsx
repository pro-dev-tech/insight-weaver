import { motion } from "framer-motion";

interface CoinSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function CoinSpinner({ size = "md", text }: CoinSpinnerProps) {
  const sizes = { sm: 32, md: 48, lg: 64 };
  const s = sizes[size];
  const fontSize = size === "sm" ? "text-sm" : size === "md" ? "text-lg" : "text-2xl";

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative" style={{ width: s, height: s }}>
        {/* Orbiting coins */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: i * 0.66 }}
          >
            <motion.span
              className={`absolute ${fontSize} font-bold text-primary`}
              style={{ top: 0, left: "50%", transform: "translateX(-50%)" }}
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.66 }}
            >
              ₹
            </motion.span>
          </motion.div>
        ))}
        {/* Center glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/10"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
      {text && (
        <motion.p
          className="text-sm text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

export function FullPageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[300] bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <CoinSpinner size="lg" text={text} />
    </div>
  );
}
