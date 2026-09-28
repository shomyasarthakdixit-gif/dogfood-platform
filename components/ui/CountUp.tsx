'use client';
import { useEffect, useState, useRef } from 'react';

export default function CountUp({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    let startTimestamp: number | null = null;
    let frameId: number;
    let observer: IntersectionObserver;

    const startAnimation = () => {
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // easeOutQuart
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeProgress * end));
        
        if (progress < 1) {
          frameId = window.requestAnimationFrame(step);
        }
      };
      frameId = window.requestAnimationFrame(step);
    };

    const node = ref.current;
    if (node) {
      observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          startAnimation();
          observer.disconnect();
        }
      }, { threshold: 0.1 });
      observer.observe(node);
    }

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      if (observer && node) observer.disconnect();
    };
  }, [end, duration]);

  return <span ref={ref}>{count}</span>;
}
