let LISTENERS: any[] = [];
let mediaQueryMatches = false;

// simulate dispatching a change event for window.matchMedia
const notifyMediaQueryChangeListeners = () => {
  LISTENERS.forEach((listener) => {
    if (typeof listener === 'function') {
      listener();
    }
  });
};

//@ts-ignore window.devicePixelRatio shim
window.devicePixelRatio = 2;

// matchMedia shim (safari style)
window.matchMedia = () =>
  (<unknown>{
    get matches() {
      return mediaQueryMatches;
    },
    addListener(fn: any) {
      LISTENERS.push(fn);
    },
    removeListener(fn: any) {
      const idx = LISTENERS.indexOf(fn);
      if (idx >= 0) {
        LISTENERS.splice(idx, 1);
      }
    },
  }) as MediaQueryList;

export const setMediaQuery = (value: boolean) => {
  mediaQueryMatches = value;
  notifyMediaQueryChangeListeners();
};

export const resetMediaQueryListeners = () => {
  LISTENERS = [];
};
