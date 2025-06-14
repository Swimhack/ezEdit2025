/**
 * Landing page adapter
 * 
 * This file provides compatibility between the imported landing page components
 * and our main application by re-exporting components with proper path resolution.
 */

// Re-export components from the landing page with proper paths
export { default as LandingIndex } from './src/pages/Index';
export { default as LandingNavigation } from './src/components/Navigation';
export { default as LandingHero } from './src/components/Hero';

// Add any other components you need to use from the landing page here
