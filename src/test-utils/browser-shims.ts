let LISTENERS: (() => void)[] = [];
let mediaQueryMatches = false;

// simulate dispatching a change event for window.matchMedia
const notifyMediaQueryChangeListeners = () => {
  LISTENERS.forEach((listener) => {
    if (typeof listener === 'function') {
      listener();
    }
  });
};

// matchMedia shim (safari style)
window.matchMedia = () =>
  (<unknown>{
    get matches() {
      return mediaQueryMatches;
    },
    addListener(fn: () => void) {
      LISTENERS.push(fn);
    },
    removeListener(fn: () => void) {
      const idx = LISTENERS.indexOf(fn);
      if (idx >= 0) {
        LISTENERS.splice(idx, 1);
      }
    },
  }) as MediaQueryList;

export const setMediaQuery = (value: boolean): void => {
  mediaQueryMatches = value;
  notifyMediaQueryChangeListeners();
};

export const resetMediaQueryListeners = (): void => {
  LISTENERS = [];
};
