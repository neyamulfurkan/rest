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
  const isFirstRender = useRef(true);
  
  const currentLevel = getPageLevel(pathname);
  const prevLevel = getPageLevel(prevPathname.current);
  
  let direction = 0;
  if (currentLevel !== -1 && prevLevel !== -1) {
    direction = currentLevel > prevLevel ? 1 : -1;
  }
  
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
    prevPathname.current = pathname;
  }, [pathname]);

  if (pathname === '/checkout') {
    return <div className="min-h-screen relative">{children}</div>;
  }

  const slideDistance = 50;

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
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={variants}
        initial={isFirstRender.current ? false : "enter"}
        animate="center"
        exit="exit"
        transition={{
          duration: 0.25,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="min-h-screen relative"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}