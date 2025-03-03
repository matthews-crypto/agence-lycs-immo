
import { useState, useEffect, useRef, RefObject } from "react";

interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

export function useIntersectionObserver<T extends Element>(options: IntersectionObserverOptions = {}): [RefObject<T>, boolean] {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        // Once visible, we can stop observing
        if (ref.current) observer.unobserve(ref.current);
      }
    }, { threshold: 0.1, ...options });

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options.root, options.rootMargin, options.threshold]);

  return [ref, isVisible];
}
