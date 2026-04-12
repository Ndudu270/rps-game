// Utility function to clamp a value between min and max

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}