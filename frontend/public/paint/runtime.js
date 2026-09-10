/* Real Mario Paint input automation. See docs/mario-paint.md for the pinned
 * emulator, ROM revision, coordinates and verification procedure. */
(() => {
  'use strict';
  const origin = location.origin;
  let initialized = false;
  let stopped = false;
  let romUrl;
  let emulator;
  const tell = (state, detail, painted = 0) => parent.postMessage({ type: 'paint-status', state, detail, painted }, origin);
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const check = () => { if (stopped) throw new Error('cancelled'); };
  const ram = () => emulator.gameManager.Module.EmulatorJSGetMemoryData('RETRO_MEMORY_SYSTEM_RAM');
  const position = () => {
    const memory = ram();
    return [memory[0x4dc] | memory[0x4dd] << 8, memory[0x4de] | memory[0x4df] << 8];
  };
  async function frames(count) {
    const start = emulator.gameManager.functions.getFrameNum();
    let last = start;
    let lastProgress = performance.now();
    while (emulator.gameManager.functions.getFrameNum() - start < count) {
      check();
      await delay(12);
      const current = emulator.gameManager.functions.getFrameNum();
      if (current !== last || document.hidden) { lastProgress = performance.now(); last = current; }
      if (performance.now() - lastProgress > 15000) throw new Error('The emulator stopped advancing. Please restart the game.');
    }
  }
  function mouse(type, dx = 0, dy = 0) {
    emulator.canvas.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, movementX: dx, movementY: dy }));
  }
  async function move(x, y) {
    for (let attempt = 0; attempt < 150; attempt++) {
      check();
      const [cx, cy] = position();
      if (cx === x && cy === y) return;
      mouse('mousemove', Math.max(-20, Math.min(20, x - cx)), Math.max(-20, Math.min(20, y - cy)));
      await frames(5);
    }
    throw new Error('The game cursor could not reach the next pixel. Please restart the drawing.');
  }
  async function click(x, y) {
    await move(x, y);
    mouse('mousedown');
    try { await frames(4); } finally { mouse('mouseup'); }
    await frames(4);
  }
  async function screenshot() {
    const bytes = await Promise.race([
      emulator.gameManager.screenshot(),
      delay(15000).then(() => { throw new Error('Could not read the game screen.'); }),
    ]);
    check();
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0); bitmap.close();
    return { width: canvas.width, height: canvas.height, context };
  }
  function pixel(screen, x, y) {
    // Snes9x screenshots are the native framebuffer, independent of CSS size.
    return [...screen.context.getImageData(x, y, 1, 1).data].slice(0, 3);
  }
  const red = rgb => rgb[0] > 220 && rgb[1] < 20 && rgb[2] < 20;
  async function draw(pixels, palette) {
    emulator = window.EJS_emulator;
    emulator.gameManager.functions.setControllerPortDevice(0, 2);
    // Synthetic inputs belong to the automation; physical input resumes on takeover.
    const guard = event => { if (!stopped && event.isTrusted) event.stopImmediatePropagation(); };
    for (const type of ['mousemove', 'mousedown', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'keydown', 'keyup']) {
      document.addEventListener(type, guard, true);
    }
    try {
      tell('drawing', 'Starting Mario Paint…');
      await frames(150);
      await move(128, 145);
      // Mario walks across the title screen. Click his path until the canvas opens.
      let entered = false;
      for (let attempt = 0; attempt < 35; attempt++) {
        await click(128, 145);
        await frames(45);
        const screen = await screenshot();
        if (red(pixel(screen, 30, 15))) { entered = true; break; }
      }
      if (!entered) throw new Error('Could not open Mario Paint from the title screen. Please restart.');
      tell('drawing', 'Opening the stamp editor…');
      await click(236, 211); await frames(30);
      await click(54, 211); await frames(180);
      const editor = await screenshot();
      const background = pixel(editor, 20, 100);
      if (!red(pixel(editor, 30, 15)) || editor.width !== 256 || editor.height !== 224
        || background.some((channel, index) => Math.abs(channel - [255, 239, 189][index]) > 3)) {
        throw new Error('The stamp editor did not open as expected.');
      }
      let painted = 0;
      // Color groups minimize trips to the palette while showing every actual click.
      for (let color = 0; color < 15; color++) {
        if (!pixels.includes(color)) continue;
        await click(30 + color * 14, 15);
        for (let index = 0; index < pixels.length; index++) {
          if (pixels[index] !== color) continue;
          await click(52 + (index % 16) * 8, 52 + Math.floor(index / 16) * 8);
          painted++;
          tell('drawing', `Painting pixel ${painted} of 256`, painted);
        }
      }
      await move(24, 190); await frames(10);
      const result = await screenshot();
      for (let index = 0; index < 256; index++) {
        const actual = pixel(result, 52 + index % 16 * 8, 52 + Math.floor(index / 16) * 8);
        if (actual.some((channel, c) => Math.abs(channel - palette[pixels[index]][c]) > 3)) {
          throw new Error('A pixel did not paint correctly. Please restart to try again.');
        }
      }
      tell('complete', 'All 256 pixels painted. Your turn!', 256);
    } catch (error) {
      if (!stopped) tell('error', error.message || 'The drawing could not finish. Please restart.');
    } finally {
      stopped = true;
      mouse('mouseup');
      for (const type of ['mousemove', 'mousedown', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'keydown', 'keyup']) {
        document.removeEventListener(type, guard, true);
      }
    }
  }
  window.addEventListener('message', event => {
    if (event.origin !== origin || event.source !== parent) return;
    const data = event.data;
    if (data?.type === 'paint-takeover') {
      stopped = true;
      if (emulator) mouse('mouseup');
      tell('playing', 'You have control. Click the game to paint.');
      return;
    }
    if (data?.type !== 'paint-init' || initialized) return;
    if (!(data.rom instanceof ArrayBuffer) || data.rom.byteLength !== 1048576 || !Array.isArray(data.pixels)
      || data.pixels.length !== 256 || data.pixels.some(p => !Number.isInteger(p) || p < 0 || p > 14)
      || !Array.isArray(data.palette) || data.palette.length !== 15) return;
    initialized = true;
    romUrl = URL.createObjectURL(new Blob([data.rom]));
    window.EJS_player = '#game';
    window.EJS_core = 'snes9x';
    window.EJS_gameUrl = romUrl;
    window.EJS_gameName = 'Mario Paint';
    window.EJS_pathtodata = '/paint/vendor/';
    window.EJS_DEBUG_XX = true;
    window.EJS_startOnLoaded = false;
    window.EJS_cacheConfig = { enabled: false };
    window.EJS_forceLegacyCores = true;
    window.EJS_volume = 0.35;
    window.EJS_defaultOptions = { 'shader': 'disabled', 'snes9x_overscan': 'enabled', 'snes9x_aspect': '4:3', 'save-state-location': 'download', 'virtual-gamepad': 'disabled' };
    window.EJS_Buttons = { restart: false, quickSave: false, quickLoad: false, cheat: false, netplay: false, exitEmulation: false };
    window.EJS_ready = () => tell('ready', 'Press Start Game below to begin.');
    window.EJS_onGameStart = () => { URL.revokeObjectURL(romUrl); void draw(data.pixels, data.palette); };
    const loader = document.createElement('script');
    loader.src = '/paint/vendor/loader.js';
    loader.onerror = () => tell('error', 'The emulator could not load. Please restart.');
    document.body.appendChild(loader);
  });
  parent.postMessage({ type: 'paint-frame-ready' }, origin);
})();
