/**
 * InfiniteMenu.js - Native JavaScript port of React Bits <InfiniteMenu />
 * 3D Spherical WebGL Menu with Procedural Instancing, Quaternion Physics & Dynamic Atlas
 */

(function (global) {
  'use strict';

  const VERTEX = `#version 300 es
in vec2 aCorner;
in vec4 aTile;
uniform vec4 uOrientation;
uniform mat4 uProjection;
uniform float uCamera;
uniform float uRadius;
uniform float uTileRadius;
uniform vec4 uSpin;
uniform float uStretch;
uniform float uShift;
out vec2 vUv;
out float vFront;
flat out float vItem;

vec3 rotate(vec4 q, vec3 v) {
  vec3 t = 2.0 * cross(q.xyz, v);
  return v + q.w * t + cross(q.xyz, t);
}

void main() {
  vec3 center = normalize(rotate(uOrientation, aTile.xyz));
  vec3 reference = abs(center.y) > 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
  vec3 tangent = normalize(cross(reference, center));
  vec3 bitangent = cross(center, tangent);
  float front = clamp(center.z, 0.0, 1.0);
  vec3 offset = (tangent * aCorner.x + bitangent * aCorner.y) * uTileRadius * mix(0.5, 1.0, front);
  vec3 motion = cross(uSpin.xyz, center);
  float sweep = length(motion);
  if (sweep > 0.0001) {
    vec3 direction = motion / sweep;
    float amount = min(0.9, uSpin.w * uStretch * 0.12) * sweep;
    offset += direction * dot(offset, direction) * amount;
  }
  // Radially lift the front-facing tile to physically prevent intersecting/z-fighting neighboring quads
  float frontLift = pow(front, 3.2) * 0.18;
  vec3 world = normalize(center * uRadius + offset) * (uRadius + frontLift);
  gl_Position = uProjection * vec4(world.xy, world.z - uCamera, 1.0);
  gl_Position.y += uShift * gl_Position.w;
  vUv = aCorner;
  vFront = center.z;
  vItem = aTile.w;
}`;

  const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uAtlas;
uniform float uCells;
uniform float uInset;
uniform float uRoundness;
uniform float uGrayscale;
uniform float uDim;
uniform float uReveal;
uniform vec3 uPlaceholder;
uniform vec3 uTone;
in vec2 vUv;
in float vFront;
flat in float vItem;
out vec4 outColor;

void main() {
  float corner = clamp(uRoundness, 0.0, 1.0);
  vec2 q = abs(vUv) - (1.0 - corner);
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - corner;
  float aa = max(fwidth(d), 0.0001);
  float mask = 1.0 - smoothstep(-aa, aa, d);
  float alpha = mask * smoothstep(0.02, 0.4, vFront) * uReveal;
  if (mask < 0.005 || alpha < 0.005) discard;

  float item = floor(vItem + 0.5);
  vec2 cell = vec2(mod(item, uCells), floor(item / uCells));
  vec2 local = vec2(vUv.x, -vUv.y) * 0.5 + 0.5;
  vec4 sampled = texture(uAtlas, (cell + uInset + local * (1.0 - 2.0 * uInset)) / uCells);
  vec3 color = mix(uPlaceholder, sampled.rgb, sampled.a);
  float focus = smoothstep(0.93, 0.997, vFront);
  float gray = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(color, vec3(gray), uGrayscale * (1.0 - focus));
  color = mix(color, uTone, uDim * (1.0 - focus));
  outColor = vec4(color * alpha, alpha);
}`;

  const GRID = 12;
  const RADIUS = 2;
  const FOV = (30 * Math.PI) / 180;
  const FRONT = [0, 0, 1];

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const normalize = v => {
    const length = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / length, v[1] / length, v[2] / length];
  };
  const quatMultiply = (a, b) => [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]
  ];
  const quatAxisAngle = (axis, angle) => {
    const s = Math.sin(angle / 2);
    return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)];
  };
  const quatNormalize = q => {
    const length = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    return [q[0] / length, q[1] / length, q[2] / length, q[3] / length];
  };
  const rotate = (q, v) => {
    const t = cross(q, v).map(value => value * 2);
    const u = cross(q, t);
    return [v[0] + q[3] * t[0] + u[0], v[1] + q[3] * t[1] + u[1], v[2] + q[3] * t[2] + u[2]];
  };

  const sphere = count => {
    const golden = Math.PI * (3 - Math.sqrt(5));
    return Array.from({ length: count }, (_, i) => {
      const y = 1 - (2 * (i + 0.5)) / count;
      const ring = Math.sqrt(1 - y * y);
      return [Math.cos(golden * i) * ring, y, Math.sin(golden * i) * ring];
    });
  };

  const luminance = hex => {
    if (!hex) return 0;
    const value = hex.replace('#', '');
    const full = value.length === 3 ? value.replace(/./g, c => c + c) : value.slice(0, 6);
    const n = parseInt(full, 16);
    if (Number.isNaN(n)) return 0;
    return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  };

  const hexToRgb = hex => {
    if (!hex) return null;
    const clean = hex.replace('#', '').trim();
    const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean.slice(0, 6);
    const n = parseInt(full, 16);
    if (Number.isNaN(n)) return null;
    return {
      r: (n >> 16) & 255,
      g: (n >> 8) & 255,
      b: n & 255
    };
  };

  const compile = (gl, type, source) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  };

  class InfiniteMenu {
    constructor(container, options = {}) {
      this.root = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this.root) {
        throw new Error('InfiniteMenu: Target container element not found.');
      }

      this.items = options.items || [];
      this.options = {
        count: clamp(Math.round(options.count !== undefined ? options.count : 140), 6, 400),
        tileSize: clamp(options.tileSize !== undefined ? options.tileSize : 0.7, 0.2, 1.2),
        roundness: clamp(options.roundness !== undefined ? options.roundness : 0.12, 0, 1),
        zoom: clamp(options.zoom !== undefined ? options.zoom : 1.75, 0.2, 4),
        pullBack: clamp(options.pullBack !== undefined ? options.pullBack : 1.1, 0, 3),
        stretch: clamp(options.stretch !== undefined ? options.stretch : 0.65, 0, 3),
        inertia: clamp(options.inertia !== undefined ? options.inertia : 0.7, 0, 1),
        autoplay: options.autoplay !== undefined ? Math.max(0, options.autoplay) : 2.5,
        grayscale: options.grayscale !== undefined ? options.grayscale : false,
        dim: clamp(options.dim !== undefined ? options.dim : 0.35, 0, 1),
        intro: options.intro !== undefined ? options.intro : true,
        showInfo: options.showInfo !== undefined ? options.showInfo : true,
        theme: options.theme === 'light' ? 'light' : 'dark',
        accentColor: options.accentColor || '#39FF14',
        onActiveChange: options.onActiveChange || null,
        onItemClick: options.onItemClick || null,
        ...options
      };

      this.active = 0;
      this.currentActiveIndex = -1;
      this.moving = true;
      this.layoutMode = 'side';
      this.alive = true;
      this.visible = true;

      this.init();
    }

    init() {
      // Ensure root has relative positioning and class
      this.root.classList.add('infinite-menu');
      this.root.tabIndex = 0;
      this.root.setAttribute('role', 'region');
      this.root.setAttribute('aria-label', 'Monster Energy Flavor Vault');

      const ink = this.options.theme === 'light' ? '#120f17' : '#ffffff';
      const accent = this.options.accentColor || '#39FF14';
      const onAccent = luminance(accent) > 0.5 ? '#000000' : '#ffffff';

      this.root.style.setProperty('--infinite-menu-text', ink);
      this.root.style.setProperty('--infinite-menu-accent', accent);
      this.root.style.setProperty('--infinite-menu-on-accent', onAccent);

      // Create Canvas
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'infinite-menu__canvas';
      this.root.appendChild(this.canvas);

      // Create Info Overlay
      if (this.options.showInfo) {
        this.infoEl = document.createElement('div');
        this.infoEl.className = 'infinite-menu__info';
        this.infoEl.setAttribute('data-moving', 'true');
        this.infoEl.setAttribute('data-zoomed', 'false');
        this.infoEl.setAttribute('data-layout', 'side');

        this.titleEl = document.createElement('h2');
        this.titleEl.className = 'infinite-menu__title';

        this.descEl = document.createElement('p');
        this.descEl.className = 'infinite-menu__description';

        this.actionBtn = document.createElement('button');
        this.actionBtn.type = 'button';
        this.actionBtn.className = 'infinite-menu__action';
        this.actionBtn.innerHTML = `
          <span>UNLEASH</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        `;

        this.infoEl.appendChild(this.titleEl);
        this.infoEl.appendChild(this.descEl);
        this.infoEl.appendChild(this.actionBtn);
        this.root.appendChild(this.infoEl);

        this.actionBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const item = this.items[this.active % this.items.length];
          if (this.options.onItemClick) {
            this.options.onItemClick(item, this.active % this.items.length);
          }
        });
      }

      // Initialize WebGL 2
      const gl = this.canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true });
      if (!gl) {
        console.warn('WebGL2 not supported, falling back to basic display.');
        return;
      }
      this.gl = gl;

      const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
      const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
      const program = gl.createProgram();
      if (!vertex || !fragment || !program) return;

      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return;
      }
      gl.useProgram(program);
      this.program = program;

      this.uniforms = {};
      for (const name of [
        'uOrientation', 'uProjection', 'uCamera', 'uRadius', 'uTileRadius',
        'uSpin', 'uStretch', 'uShift', 'uAtlas', 'uCells', 'uInset',
        'uRoundness', 'uGrayscale', 'uDim', 'uReveal', 'uPlaceholder', 'uTone'
      ]) {
        this.uniforms[name] = gl.getUniformLocation(program, name);
      }

      // Geometry: Quad grid for instanced rendering
      const corners = [];
      const indices = [];
      for (let y = 0; y <= GRID; y++) {
        for (let x = 0; x <= GRID; x++) corners.push((x / GRID) * 2 - 1, (y / GRID) * 2 - 1);
      }
      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          const i = y * (GRID + 1) + x;
          indices.push(i, i + 1, i + GRID + 1, i + 1, i + GRID + 2, i + GRID + 1);
        }
      }
      this.indicesLength = indices.length;

      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);

      const cornerBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(corners), gl.STATIC_DRAW);
      const cornerLocation = gl.getAttribLocation(program, 'aCorner');
      gl.enableVertexAttribArray(cornerLocation);
      gl.vertexAttribPointer(cornerLocation, 2, gl.FLOAT, false, 0, 0);

      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

      this.tileBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.tileBuffer);
      const tileLocation = gl.getAttribLocation(program, 'aTile');
      gl.enableVertexAttribArray(tileLocation);
      gl.vertexAttribPointer(tileLocation, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(tileLocation, 1);
      gl.bindVertexArray(null);

      this.vao = vao;

      // Atlas Texture
      this.atlasTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
      gl.uniform1i(this.uniforms.uAtlas, 0);

      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      this.reduce = reduce;
      this.atlas = { canvas: document.createElement('canvas'), cells: 1, cell: 512, request: 0, dirty: false };
      this.drag = { active: false, id: -1, x: 0, y: 0, dx: 0, dy: 0, moved: 0, start: 0 };
      this.state = {
        width: 1,
        height: 1,
        tiles: [],
        assign: [],
        count: 0,
        orientation: quatNormalize([0.08, -0.3, 0, 1]),
        axis: [0, 1, 0],
        speed: this.options.intro && !reduce ? 3.2 : 0,
        camera: 0,
        target: -1,
        front: 0,
        shown: -1,
        moving: true,
        reveal: 0,
        hovered: false,
        focused: false,
        idle: 0,
        settle: 0,
        tilePx: 0,
        layout: 'side',
        shift: 0,
        zoomed: false,
        started: false
      };

      this.raf = 0;
      this.timer = 0;
      this.last = 0;

      this.setupEvents();
      this.loadItems(this.items);
      this.resize();
      this.updateInfoDisplay(0);
    }

    tileRadius() {
      return 0.5 * RADIUS * Math.sqrt((4 * Math.PI) / Math.max(1, this.state.count)) * this.options.tileSize;
    }

    restDistance() {
      const aspect = this.state.width / this.state.height;
      const span = Math.tan(FOV / 2) * Math.min(1, aspect);
      return RADIUS + this.tileRadius() / (0.46 * this.options.zoom * span);
    }

    layout() {
      const s = this.options;
      if (s.count === this.state.count) return;
      this.state.count = s.count;
      this.state.tiles = sphere(s.count);
      const items = Math.max(1, this.items.length);
      const usage = new Array(items).fill(0);
      this.state.assign = this.state.tiles.map(() => -1);

      this.state.tiles.forEach((tile, i) => {
        const near = this.state.tiles
          .map((other, j) => [j === i ? -2 : dot(tile, other), j])
          .sort((a, b) => b[0] - a[0])
          .slice(0, 6)
          .map(([, j]) => this.state.assign[j]);
        let pick = -1;
        for (let k = 0; k < items; k++) {
          const candidate = (i + k) % items;
          if (near.includes(candidate)) continue;
          if (pick < 0 || usage[candidate] < usage[pick]) pick = candidate;
        }
        if (pick < 0) pick = i % items;
        this.state.assign[i] = pick;
        usage[pick] += 1;
      });

      const data = new Float32Array(s.count * 4);
      this.state.tiles.forEach((tile, i) => data.set([tile[0], tile[1], tile[2], this.state.assign[i]], i * 4));
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tileBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

      let first = -1;
      let firstZ = -2;
      this.state.tiles.forEach((tile, i) => {
        const z = rotate(this.state.orientation, tile)[2];
        if (this.state.assign[i] === 0 && z > firstZ) {
          firstZ = z;
          first = i;
        }
      });
      this.state.target = first;
    }

    uploadAtlas() {
      this.atlas.dirty = false;
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.atlasTexture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.atlas.canvas);
      this.gl.generateMipmap(this.gl.TEXTURE_2D);
    }

    loadItems(list) {
      this.items = list || [];
      const request = ++this.atlas.request;
      const total = Math.max(1, this.items.length);
      this.atlas.cells = Math.ceil(Math.sqrt(total));
      this.atlas.cell = clamp(Math.floor(4096 / this.atlas.cells), 64, 512);
      this.atlas.canvas.width = this.atlas.cells * this.atlas.cell;
      this.atlas.canvas.height = this.atlas.cells * this.atlas.cell;
      const ctx = this.atlas.canvas.getContext('2d');
      ctx?.clearRect(0, 0, this.atlas.canvas.width, this.atlas.canvas.height);
      this.uploadAtlas();
      this.state.count = 0;
      this.layout();

      let pending = this.items.length;
      if (!pending) this.state.started = true;
      this.items.forEach((item, index) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.decoding = 'async';
        const done = () => {
          pending -= 1;
          if (pending <= 0) this.state.started = true;
          this.wake();
        };
        image.onload = () => {
          if (!this.alive || request !== this.atlas.request || !ctx) return;
          const size = this.atlas.cell;
          const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
          const width = image.naturalWidth * scale;
          const height = image.naturalHeight * scale;
          const x = (index % this.atlas.cells) * size;
          const y = Math.floor(index / this.atlas.cells) * size;
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, size, size);
          ctx.clip();
          ctx.drawImage(image, x + (size - width) / 2, y + (size - height) / 2, width, height);
          ctx.restore();
          this.atlas.dirty = true;
          done();
        };
        image.onerror = () => {
          if (!this.alive || request !== this.atlas.request) return;
          done();
        };
        image.src = item?.image ?? '';
      });
    }

    measure() {
      const rest = this.restDistance();
      const radius = (this.tileRadius() / ((rest - RADIUS) * Math.tan(FOV / 2))) * (this.state.height / 2);
      const rounded = Math.round(radius);
      if (rounded !== this.state.tilePx) {
        this.state.tilePx = rounded;
        this.root.style.setProperty('--infinite-menu-tile', `${rounded}px`);
      }
      const mode = this.state.width / 2 - radius < 120 ? 'stacked' : 'side';
      if (mode !== this.state.layout) {
        this.state.layout = mode;
        this.infoEl?.setAttribute('data-layout', mode);
      }
    }

    nearest() {
      let best = 0;
      let bestZ = -2;
      for (let i = 0; i < this.state.tiles.length; i++) {
        const z = rotate(this.state.orientation, this.state.tiles[i])[2];
        if (z > bestZ) {
          bestZ = z;
          best = i;
        }
      }
      return best;
    }

    neighbor(from, direction) {
      const origin = rotate(this.state.orientation, this.state.tiles[from]);
      let best = -1;
      let bestScore = Infinity;
      for (let i = 0; i < this.state.tiles.length; i++) {
        if (i === from) continue;
        const c = rotate(this.state.orientation, this.state.tiles[i]);
        if (c[2] < 0) continue;
        const dx = c[0] - origin[0];
        const dy = c[1] - origin[1];
        const length = Math.hypot(dx, dy);
        if (length < 0.0001) continue;
        const align = (dx * direction[0] + dy * direction[1]) / length;
        if (align < 0.55) continue;
        const score = length * (2.2 - align);
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      }
      return best;
    }

    goTo(index) {
      if (index < 0) return;
      this.state.target = index;
      this.state.speed = 0;
      this.state.idle = 0;
      this.state.zoomed = false;
      this.infoEl?.setAttribute('data-zoomed', 'false');
      this.infoEl?.setAttribute('data-moving', 'true');
      this.wake();
    }

    pick(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      const aspect = rect.width / rect.height;
      const span = Math.tan(FOV / 2);
      const x = (((clientX - rect.left) / rect.width) * 2 - 1) * aspect;
      const y = 1 - ((clientY - rect.top) / rect.height) * 2 - this.state.shift;
      const radius = this.tileRadius();
      let best = -1;
      let bestDistance = Infinity;
      for (let i = 0; i < this.state.tiles.length; i++) {
        const c = rotate(this.state.orientation, this.state.tiles[i]);
        if (c[2] < 0.2) continue;
        const depth = this.state.camera - c[2] * RADIUS;
        const sx = (c[0] * RADIUS) / (depth * span);
        const sy = (c[1] * RADIUS) / (depth * span);
        const reach = (radius * (0.5 + 0.5 * c[2])) / (depth * span);
        const distance = Math.hypot(sx - x, sy - y);
        if (distance < reach && distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      }
      return best;
    }

    activate(index) {
      if (!this.items.length) return;
      const itemIndex = (this.state.assign[index] ?? 0) % this.items.length;
      const item = this.items[itemIndex];
      if (this.options.onItemClick) {
        this.options.onItemClick(item, itemIndex);
      } else if (item?.link) {
        window.open(item.link, item.link.startsWith('http') ? '_blank' : '_self');
      }
    }

    report() {
      const index = this.items.length ? (this.state.assign[this.state.front] ?? 0) % this.items.length : 0;
      if (!this.state.moving && index !== this.state.shown) {
        this.state.shown = index;
        this.active = index;
        this.currentActiveIndex = index;
        this.updateInfoDisplay(index);
        this.options.onActiveChange?.(this.items[index], index);
      }
    }

    updateInfoDisplay(index) {
      if (!this.items.length) return;
      const item = this.items[index % this.items.length];
      if (!item) return;

      const accent = item.color || this.options.accentColor || '#39FF14';
      const rgb = hexToRgb(accent);
      const rgbStr = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '57, 255, 20';
      const onAccent = luminance(accent) > 0.5 ? '#000000' : '#ffffff';

      // Update root variables
      this.root.style.setProperty('--infinite-menu-accent', accent);
      this.root.style.setProperty('--infinite-menu-accent-rgb', rgbStr);
      this.root.style.setProperty('--infinite-menu-on-accent', onAccent);

      // Update container wrapper and external header/overlays
      const wrapper = this.root.closest('.infinite-menu-wrapper');
      if (wrapper) {
        wrapper.style.setProperty('--infinite-menu-accent', accent);
        wrapper.style.setProperty('--infinite-menu-accent-rgb', rgbStr);

        const header = wrapper.querySelector('.vault-overlay-header');
        if (header) {
          const neonText = header.querySelector('.neon-text');
          if (neonText) {
            neonText.style.color = accent;
            neonText.style.textShadow = `0 0 20px rgba(${rgbStr}, 0.75), 0 0 40px rgba(${rgbStr}, 0.35)`;
          }
          const subBadge = header.querySelector('.vault-sub-badge');
          if (subBadge) {
            subBadge.style.color = accent;
            subBadge.style.borderColor = `rgba(${rgbStr}, 0.45)`;
            subBadge.style.boxShadow = `0 0 16px rgba(${rgbStr}, 0.25)`;
            subBadge.style.background = `rgba(${rgbStr}, 0.08)`;
          }
          const dot = header.querySelector('.blinking-lime');
          if (dot) {
            dot.style.background = accent;
            dot.style.boxShadow = `0 0 10px ${accent}`;
          }
        }
      }

      // Update title with dynamic flavor font colours and glowing text-shadow
      if (this.titleEl) {
        this.titleEl.innerHTML = `<span class="vault-flavor-title" style="color: #ffffff; text-shadow: 0 4px 20px rgba(0, 0, 0, 0.9), 0 0 24px rgba(${rgbStr}, 0.45);">${item.title}</span><span class="highlight-accent" style="color: ${accent}; text-shadow: 0 0 16px ${accent};">${item.subtitle || '160MG CAFFEINE'}</span>`;
      }
      if (this.descEl) {
        this.descEl.textContent = item.description || '';
      }
      if (this.actionBtn) {
        this.actionBtn.style.color = accent;
        this.actionBtn.style.borderColor = accent;
        this.actionBtn.style.boxShadow = `0 10px 25px rgba(0, 0, 0, 0.7), 0 0 20px rgba(${rgbStr}, 0.4)`;
      }
    }

    frame(now) {
      this.raf = 0;
      if (!this.alive || !this.visible) return;
      const s = this.options;
      const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
      this.last = now;
      this.layout();
      if (this.atlas.dirty) this.uploadAtlas();
      if (this.state.started) this.state.reveal = Math.min(1, this.state.reveal + dt / (this.reduce ? 0.01 : 0.7));
      const minSide = Math.min(this.state.width, this.state.height);

      if (this.drag.active) {
        if (this.drag.dx || this.drag.dy) {
          const length = Math.hypot(this.drag.dx, this.drag.dy);
          const angle = (length / minSide) * 2.6;
          const axis = normalize([this.drag.dy, this.drag.dx, 0]);
          this.state.orientation = quatNormalize(quatMultiply(quatAxisAngle(axis, angle), this.state.orientation));
          const blend = 1 - Math.exp(-dt * 30);
          this.state.axis = normalize(this.state.axis.map((value, i) => value + (axis[i] - value) * blend));
          this.state.speed += (angle / dt - this.state.speed) * blend;
          this.drag.dx = 0;
          this.drag.dy = 0;
        } else {
          this.state.speed *= Math.exp(-dt * 14);
        }
      } else {
        if (this.state.speed > 0.0005) {
          this.state.orientation = quatNormalize(
            quatMultiply(quatAxisAngle(this.state.axis, this.state.speed * dt), this.state.orientation)
          );
          this.state.speed *= Math.exp(-dt * (6 - 5 * s.inertia));
        } else {
          this.state.speed = 0;
        }
        const goal = this.state.target >= 0 ? this.state.target : this.nearest();
        const current = rotate(this.state.orientation, this.state.tiles[goal]);
        const angle = Math.acos(clamp(dot(current, FRONT), -1, 1));
        const pull = clamp(1 - this.state.speed / 1.4, 0, 1);
        if (angle > 0.0002 && pull > 0) {
          const axis = cross(current, FRONT);
          const step = angle * (1 - Math.exp(-dt * (this.state.target >= 0 ? 6 : 8))) * pull;
          if (Math.hypot(axis[0], axis[1], axis[2]) > 1e-6) {
            this.state.orientation = quatNormalize(quatMultiply(quatAxisAngle(normalize(axis), step), this.state.orientation));
          }
        } else if (this.state.target >= 0 && this.state.speed === 0) {
          this.state.target = -1;
        }
        this.state.front = goal;
      }

      const settledAngle = Math.acos(clamp(rotate(this.state.orientation, this.state.tiles[this.state.front])[2], -1, 1));
      const moving = this.drag.active || this.state.speed > 0.08 || settledAngle > 0.01;
      if (moving !== this.state.moving) {
        this.state.moving = moving;
        this.infoEl?.setAttribute('data-moving', moving ? 'true' : 'false');
      }
      this.state.settle += ((moving ? 0 : 1) - this.state.settle) * (1 - Math.exp(-dt * (moving ? 10 : 3)));
      if (!moving) this.report();

      const rest = this.restDistance();
      const pullAmount = clamp(this.drag.active ? 1 : this.state.speed / 2.2, 0, 1);
      const target = rest + s.pullBack * pullAmount * RADIUS * 1.25 + (1 - this.state.reveal) * RADIUS * 1.5;
      if (!this.state.camera) this.state.camera = target + RADIUS;
      this.state.camera += (target - this.state.camera) * (1 - Math.exp(-dt * 4.5));

      // Zoom detection: Font appears ONLY when the image of flavor is fully zoomed in (and NOT while hovering/browsing)
      const isZoomed = !moving && !this.drag.active && Math.abs(this.state.camera - rest) < 0.08 && this.state.settle > 0.88;
      if (isZoomed !== this.state.zoomed) {
        this.state.zoomed = isZoomed;
        this.infoEl?.setAttribute('data-zoomed', isZoomed ? 'true' : 'false');
        if (isZoomed) {
          const frontItemIdx = this.items.length ? (this.state.assign[this.state.front] ?? 0) % this.items.length : 0;
          this.currentActiveIndex = frontItemIdx;
          this.active = frontItemIdx;
          this.updateInfoDisplay(frontItemIdx);
          this.options.onActiveChange?.(this.items[frontItemIdx], frontItemIdx);
        }
      }

      if (s.autoplay > 0 && !moving && !this.state.hovered && !this.state.focused && !this.reduce) {
        this.state.idle += dt;
        if (this.state.idle >= s.autoplay) {
          this.state.idle = 0;
          this.goTo(this.neighbor(this.state.front, [1, 0]));
        }
      } else {
        this.state.idle = 0;
      }

      this.measure();
      const shiftTarget = this.state.layout === 'stacked' ? Math.min(0.3, 72 / this.state.height) : 0;
      this.state.shift += (shiftTarget - this.state.shift) * (1 - Math.exp(-dt * 6));
      this.render();

      const busy =
        moving ||
        Math.abs(target - this.state.camera) > 0.001 ||
        Math.abs((this.state.layout === 'stacked' ? Math.min(0.3, 72 / this.state.height) : 0) - this.state.shift) > 0.0005 ||
        Math.abs((moving ? 0 : 1) - this.state.settle) > 0.002 ||
        this.state.reveal < 1 ||
        this.atlas.dirty ||
        !this.state.started;

      if (busy) this.raf = requestAnimationFrame(this.frame.bind(this));
      else {
        this.last = 0;
        if (s.autoplay > 0 && !this.state.hovered && !this.state.focused && !this.reduce) {
          clearTimeout(this.timer);
          this.timer = window.setTimeout(this.wake.bind(this), Math.max(16, (s.autoplay - this.state.idle) * 1000));
        }
      }
    }

    render() {
      const gl = this.gl;
      const s = this.options;
      const aspect = this.state.width / this.state.height;
      const f = 1 / Math.tan(FOV / 2);
      const near = 0.5;
      const far = 12.0;
      const projection = new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) / (near - far), -1,
        0, 0, (2 * far * near) / (near - far), 0
      ]);

      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(this.program);

      const [qx, qy, qz, qw] = this.state.orientation;
      gl.uniform4f(this.uniforms.uOrientation, qx, qy, qz, qw);
      gl.uniformMatrix4fv(this.uniforms.uProjection, false, projection);
      gl.uniform1f(this.uniforms.uCamera, this.state.camera);
      gl.uniform1f(this.uniforms.uRadius, RADIUS);
      gl.uniform1f(this.uniforms.uTileRadius, this.tileRadius());
      gl.uniform4f(this.uniforms.uSpin, this.state.axis[0], this.state.axis[1], this.state.axis[2], this.reduce ? 0 : this.state.speed);
      gl.uniform1f(this.uniforms.uStretch, s.stretch);
      gl.uniform1f(this.uniforms.uShift, this.state.shift);
      gl.uniform1f(this.uniforms.uCells, this.atlas.cells);
      gl.uniform1f(this.uniforms.uInset, 2 / this.atlas.cell);
      gl.uniform1f(this.uniforms.uRoundness, s.roundness);
      gl.uniform1f(this.uniforms.uGrayscale, s.grayscale ? 1 : 0);
      gl.uniform1f(this.uniforms.uDim, s.dim * (0.45 + 0.55 * this.state.settle));
      gl.uniform1f(this.uniforms.uReveal, this.state.reveal);

      if (s.theme === 'light') {
        gl.uniform3f(this.uniforms.uPlaceholder, 0.9, 0.9, 0.91);
        gl.uniform3f(this.uniforms.uTone, 1, 1, 1);
      } else {
        gl.uniform3f(this.uniforms.uPlaceholder, 0.1, 0.1, 0.12);
        gl.uniform3f(this.uniforms.uTone, 0.02, 0.02, 0.03);
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
      gl.bindVertexArray(this.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, this.indicesLength, gl.UNSIGNED_SHORT, 0, this.state.tiles.length);
      gl.bindVertexArray(null);
    }

    wake() {
      clearTimeout(this.timer);
      if (this.raf || !this.alive || !this.visible) return;
      this.raf = requestAnimationFrame(this.frame.bind(this));
    }

    setupEvents() {
      const canvas = this.canvas;
      const root = this.root;

      canvas.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        canvas.setPointerCapture?.(event.pointerId);
        this.drag.active = true;
        this.drag.id = event.pointerId;
        this.drag.x = event.clientX;
        this.drag.y = event.clientY;
        this.drag.dx = 0;
        this.drag.dy = 0;
        this.drag.moved = 0;
        this.drag.start = performance.now();
        this.state.target = -1;
        this.state.zoomed = false;
        this.infoEl?.setAttribute('data-zoomed', 'false');
        this.infoEl?.setAttribute('data-moving', 'true');
        this.wake();
      });

      canvas.addEventListener('pointermove', event => {
        if (!this.drag.active || event.pointerId !== this.drag.id) return;
        const dx = event.clientX - this.drag.x;
        const dy = event.clientY - this.drag.y;
        this.drag.x = event.clientX;
        this.drag.y = event.clientY;
        this.drag.dx += dx;
        this.drag.dy += dy;
        this.drag.moved += Math.hypot(dx, dy);
        this.wake();
      });

      const onPointerUp = event => {
        if (!this.drag.active || event.pointerId !== this.drag.id) return;
        this.drag.active = false;
        canvas.releasePointerCapture?.(event.pointerId);
        if (this.drag.moved < 6 && performance.now() - this.drag.start < 450) {
          const index = this.pick(event.clientX, event.clientY);
          if (index >= 0 && index === this.state.front) {
            this.activate(index);
          } else if (index >= 0) {
            this.goTo(index);
          }
        }
        this.wake();
      };

      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);

      root.addEventListener('keydown', event => {
        const directions = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
        if (directions[event.key]) {
          event.preventDefault();
          this.goTo(this.neighbor(this.state.target >= 0 ? this.state.target : this.state.front, directions[event.key]));
        } else if (event.key === 'Enter' && event.target === root) {
          event.preventDefault();
          this.activate(this.state.front);
        }
      });

      root.addEventListener('pointerenter', () => {
        this.state.hovered = true;
      });
      root.addEventListener('pointerleave', () => {
        this.state.hovered = false;
        this.wake();
      });

      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(root);

      this.intersectionObserver = new IntersectionObserver(entries => {
        this.visible = entries.some(entry => entry.isIntersecting);
        if (this.visible) {
          this.last = 0;
          this.wake();
        }
      });
      this.intersectionObserver.observe(root);
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.state.width = Math.max(1, this.root.clientWidth);
      this.state.height = Math.max(1, this.root.clientHeight);
      this.canvas.width = Math.round(this.state.width * dpr);
      this.canvas.height = Math.round(this.state.height * dpr);
      if (!this.raf) this.render();
      this.wake();
    }

    destroy() {
      this.alive = false;
      cancelAnimationFrame(this.raf);
      clearTimeout(this.timer);
      this.resizeObserver?.disconnect();
      this.intersectionObserver?.disconnect();
    }
  }

  global.InfiniteMenu = InfiniteMenu;

})(typeof window !== 'undefined' ? window : this);
