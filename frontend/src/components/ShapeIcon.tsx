import { Triangle, Square, Circle, Hexagon } from 'lucide-react';

export function ShapeIcon({ shape, className }: { shape: string, className?: string }) {
  // We use Hexagon for Diamond by rotating it, or just use a custom SVG for true diamond if needed. 
  // Wait, Lucide has 'Diamond' icon in some versions, but to be safe we can use Hexagon or just inline an SVG for diamond.
  // Actually, Lucide has no `Diamond` in old versions, but we'll use an inline SVG to be 100% like Kahoot.
  
  if (shape === 'triangle') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 2L22 20H2L12 2Z" />
      </svg>
    );
  }
  
  if (shape === 'diamond') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 2L22 12L12 22L2 12L12 2Z" />
      </svg>
    );
  }
  
  if (shape === 'circle') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  }
  
  if (shape === 'square') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    );
  }

  return null;
}
