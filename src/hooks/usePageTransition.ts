import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export function usePageTransition() {
  const [location] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionClass, setTransitionClass] = useState('page-transition');

  useEffect(() => {
    // Start transition
    setIsTransitioning(true);
    
    // Set appropriate transition class based on route
    if (location === '/') {
      setTransitionClass('page-transition-fade');
    } else if (location === '/profile') {
      setTransitionClass('page-transition-up');
    } else if (location === '/history') {
      setTransitionClass('page-transition-scale');
    } else {
      setTransitionClass('page-transition');
    }

    // End transition after animation duration
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 400); // Match longest animation duration

    return () => clearTimeout(timer);
  }, [location]);

  return {
    isTransitioning,
    transitionClass,
    location
  };
}