import { Stopwatch } from './stopwatch';

describe('Stopwatch tests', () => {
  let now = 0;
  const originalPerfNow: () => number = global.performance.now;

  beforeEach(() => {
    now = 0;
    global.performance.now = () => now;
  });

  afterEach(() => {
    global.performance.now = originalPerfNow;
  });

  test('initial elapsed time value is zero', () => {
    const watch = new Stopwatch();
    expect(watch.elapsedTime).toBe(0);
    expect(watch.running).toBe(false);
  });

  test('chaining syntax to start', () => {
    const watch = new Stopwatch().start();
    expect(watch.running).toBe(true);
  });

  test('start/stop/reset functionality', () => {
    const watch = new Stopwatch().start();
    now += 1000;
    watch.stop();
    expect(watch.elapsedTime).toBe(1000);
    now += 1000;
    expect(watch.elapsedTime).toBe(1000);
    watch.start();
    now += 1000;
    watch.stop();
    expect(watch.elapsedTime).toBe(2000);
    watch.reset();
    expect(watch.elapsedTime).toBe(0);
  });
});
