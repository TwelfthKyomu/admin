'use client';

import { useEffect, useRef } from 'react';
import { startProgress } from '../lib/progress';

export const useToastProgress = (duration: number) => {
    const barRef = useRef<HTMLSpanElement>(null);
    const animationRef = useRef<Animation>(undefined);

    useEffect(() => {
        if (!barRef.current) return;

        const animation = startProgress(barRef.current, duration);

        animationRef.current = animation;

        return () => animation.cancel();
    }, [duration]);

    return {
        barRef,
        pause: () => animationRef.current?.pause(),
        resume: () => animationRef.current?.play(),
    };
};
