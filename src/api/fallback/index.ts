/**
 * Fallback data for text API calls
 * These are used when the primary API endpoints fail
 */

// Dynamic imports to avoid loading large JSON files unless needed
export const getFontStyleTypesFallback = async () => {
  const module = await import('./font-style-types.json');
  return module.default;
};

export const getFontStylesFallback1 = async () => {
  const module = await import('./font-styles-1.json');
  return module.default;
};

export const getFontStylesFallback2 = async () => {
  const module = await import('./font-styles-2.json');
  return module.default;
};

export const getFontStylesFallback3 = async () => {
  const module = await import('./font-styles-3.json');
  return module.default;
};

// Helper function to get fallback by index for sequential calls
export const getFontStylesFallbackByIndex = async (index: number) => {
  switch (index) {
    case 0:
      return getFontStylesFallback1();
    case 1:
      return getFontStylesFallback2();
    case 2:
      return getFontStylesFallback3();
    default:
      return getFontStylesFallback1();
  }
};