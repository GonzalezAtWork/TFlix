import 'whatwg-fetch';
import './spatial-navigation-polyfill.js';
import './ui.js';
import './contentDetector.js';
import { initializePerformanceOptimizations } from './performance.js';
import { initializeAdBlocker } from './adBlocker.js';

// Initialize performance optimizations early
initializePerformanceOptimizations();

// Initialize ad blocker early
try {
    initializeAdBlocker();
} catch (e) {
    console.error('TFlix: Error initializing ad blocker:', e);
}
