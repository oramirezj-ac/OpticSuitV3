import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for tracking user inactivity
 * @param {Function} onIdle - Callback function executed when the user is idle
 * @param {number} idleTime - Time in minutes before considering the user idle (default 60 mins)
 */
const useIdleTimeout = (onIdle, idleTime = 60) => {
    // Convert minutes to milliseconds
    const idleTimeoutMillseconds = idleTime * 60 * 1000;
    
    // Timer reference for cleanup
    const [timer, setTimer] = useState(null);

    const handleIdle = useCallback(() => {
        if (onIdle) {
            onIdle();
        }
    }, [onIdle]);

    const startTimer = useCallback(() => {
        // Clear previous timer if it exists
        if (timer) {
            clearTimeout(timer);
        }
        
        // Start a new timer
        const newTimer = setTimeout(handleIdle, idleTimeoutMillseconds);
        setTimer(newTimer);
    }, [handleIdle, idleTimeoutMillseconds, timer]);

    const resetTimer = useCallback(() => {
        startTimer();
    }, [startTimer]);

    useEffect(() => {
        // Events that qualify as activity
        const events = [
            'mousemove',
            'keydown',
            'wheel',
            'click',
            'scroll',
            'touchstart'
        ];

        const handleEvent = () => {
            resetTimer();
        };

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, handleEvent);
        });

        // Start timer initially
        startTimer();

        // Cleanup function
        return () => {
            if (timer) {
                clearTimeout(timer);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleEvent);
            });
        };
    }, [resetTimer]); // We don't want to re-run this effect when timer changes, only when resetTimer changes

    return { resetTimer };
};

export default useIdleTimeout;
