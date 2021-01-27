const stub = (query: string): MediaQueryList => {
  return (<unknown>{
    media: query,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    matches: false,
    onchange: null,
  }) as MediaQueryList;
};

/**
 * Adds missing event listener functions to MediaQueryList object
 *
 * @param mediaQueryList return value of window.matchMedia
 */
const patchMatchMedia = (mediaQueryList: MediaQueryList): MediaQueryList => {
  if ('onchange' in mediaQueryList === false) {
    mediaQueryList.onchange = null;
    mediaQueryList.addEventListener = (_eventType: string, fn: any) => {
      mediaQueryList.addListener(fn?.bind(mediaQueryList));
    };
    mediaQueryList.removeEventListener = (_eventType: string, fn: any) => {
      mediaQueryList.removeListener(fn?.bind(mediaQueryList));
    };
  }
  return mediaQueryList;
};

/**
 * Polyfilled wrapper around `window.matchMedia`.
 *
 * @param query a css media query
 * @returns MediaQueryList object
 */
function mediaQuery(query: string): MediaQueryList {
  const hasMediaQuery = typeof window !== 'undefined' && 'matchMedia' in window;
  const mediaQuery = hasMediaQuery && patchMatchMedia(window.matchMedia(query));
  return mediaQuery || stub(query);
}

export function prefersReducedMotion(): MediaQueryList {
  return mediaQuery('(prefers-reduced-motion: reduce)');
}
