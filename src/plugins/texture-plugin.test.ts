import './texture-plugin';
import '../shader-canvas';
import '../test-utils/browser-shims';
import { resetMediaQueryListeners } from '../test-utils/browser-shims';
import { TexturePlugin } from './texture-plugin';
import { ShaderCanvasPluginBase } from 'plugins/shader-canvas-plugin';
// import { ShaderCanvas } from '../shader-canvas';

describe('TexturePlugin tests', () => {
  beforeEach(() => {
    resetMediaQueryListeners();
    const element = document.createElement('shader-canvas');
    element.setAttribute('autoplay', '');
    document.body.appendChild(element);
  });

  test('TexturePlugin was globally added to window.ShaderCanvasPlugins', () => {
    expect(window.ShaderCanvasPlugins).toBeDefined();
    expect(Object.values(window.ShaderCanvasPlugins)).toContain(TexturePlugin);
  });

  afterEach(() => {
    const element = document.querySelector('shader-canvas');
    if (element) {
      element.remove();
    }
  });
});
