'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useRef } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const PAGE_LEVELS: Record<string, number> = {
  '/': 0,
  '/menu': 1,
  '/checkout': 2,
  '/order-tracking': 3,
  '/booking': 4,
  '/contact': 5,
  '/login': 6,
  '/signup': 7,
  '/account': 8,
  '/account/orders': 9,
  '/account/bookings': 10,
  '/account/addresses': 11,
};

function getPageLevel(path: string): number {
  if (PAGE_LEVELS[path] !== undefined) return PAGE_LEVELS[path];
  for (const [key, value] of Object.entries(PAGE_LEVELS)) {
    if (path.startsWith(key + '/')) return value;
  }
  return -1;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  
  // HOOKS MUST COME FIRST - before any conditional returns
  const currentLevel = getPageLevel(pathname);
  const prevLevel = getPageLevel(prevPathname.current);
  
  let direction = 0;
  if (currentLevel !== -1 && prevLevel !== -1) {
    direction = currentLevel > prevLevel ? 1 : -1;
  }
  
  useEffect(() => {
    prevPathname.current = pathname;
  }, [pathname]);

  // NOW safe to conditionally return (after all hooks)
  if (pathname === '/checkout') {
    return <div className="min-h-screen relative">{children}</div>;
  }

  const slideDistance = 100;

  const variants = {
    enter: (dir: number) => ({
      x: dir === 1 ? -slideDistance : dir === -1 ? slideDistance : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir === 1 ? slideDistance : dir === -1 ? -slideDistance : 0,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          duration: 0.2,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="min-h-screen relative"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}