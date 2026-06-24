/**
 * Lightweight polyfill for DOMMatrix and Path2D used by pdfjs-dist on serverless environments.
 * On Vercel (serverless), the native `canvas` package is not available.
 * pdfjs-dist only needs DOMMatrix for text extraction (not rendering),
 * so a minimal polyfill is sufficient.
 */

if (typeof globalThis.DOMMatrix === "undefined") {
  // Minimal DOMMatrix polyfill — enough for pdfjs-dist text extraction
  class DOMMatrixPolyfill {
    a: number; b: number; c: number; d: number; e: number; f: number;
    m11: number; m12: number; m13: number; m14: number;
    m21: number; m22: number; m23: number; m24: number;
    m31: number; m32: number; m33: number; m34: number;
    m41: number; m42: number; m43: number; m44: number;
    is2D: boolean;
    isIdentity: boolean;

    constructor(init?: string | number[]) {
      // Identity matrix defaults
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
      this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
      this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
      this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
      this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
      this.is2D = true;
      this.isIdentity = true;

      if (Array.isArray(init)) {
        if (init.length === 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
          this.m11 = this.a; this.m12 = this.b;
          this.m21 = this.c; this.m22 = this.d;
          this.m41 = this.e; this.m42 = this.f;
        } else if (init.length === 16) {
          [
            this.m11, this.m12, this.m13, this.m14,
            this.m21, this.m22, this.m23, this.m24,
            this.m31, this.m32, this.m33, this.m34,
            this.m41, this.m42, this.m43, this.m44,
          ] = init;
          this.a = this.m11; this.b = this.m12;
          this.c = this.m21; this.d = this.m22;
          this.e = this.m41; this.f = this.m42;
          this.is2D = false;
        }
        this.isIdentity = false;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transformPoint(_point?: { x: number; y: number }) {
      return { x: 0, y: 0, z: 0, w: 1 };
    }

    inverse() {
      return new DOMMatrixPolyfill();
    }

    multiply(_other?: DOMMatrixPolyfill) {
      return new DOMMatrixPolyfill();
    }

    translate(_tx?: number, _ty?: number, _tz?: number) {
      return new DOMMatrixPolyfill();
    }

    scale(_scaleX?: number, _scaleY?: number) {
      return new DOMMatrixPolyfill();
    }

    // Static fromMatrix to support pdfjs-dist
    static fromMatrix(other?: Record<string, number>) {
      const m = new DOMMatrixPolyfill();
      if (other) {
        m.a = other.a ?? m.a; m.b = other.b ?? m.b;
        m.c = other.c ?? m.c; m.d = other.d ?? m.d;
        m.e = other.e ?? m.e; m.f = other.f ?? m.f;
      }
      return m;
    }

    static fromFloat32Array(arr: Float32Array) {
      return new DOMMatrixPolyfill(Array.from(arr));
    }

    static fromFloat64Array(arr: Float64Array) {
      return new DOMMatrixPolyfill(Array.from(arr));
    }
  }

  (globalThis as Record<string, unknown>).DOMMatrix = DOMMatrixPolyfill;
}

if (typeof globalThis.Path2D === "undefined") {
  // Minimal Path2D stub — not used during text extraction, but prevents crashes
  class Path2DPolyfill {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_path?: string | Path2DPolyfill) {
      // no-op
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addPath(_path: Path2DPolyfill) { /* no-op */ }
    closePath() { /* no-op */ }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    moveTo(_x: number, _y: number) { /* no-op */ }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    lineTo(_x: number, _y: number) { /* no-op */ }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    bezierCurveTo(_cp1x: number, _cp1y: number, _cp2x: number, _cp2y: number, _x: number, _y: number) { /* no-op */ }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    quadraticCurveTo(_cpx: number, _cpy: number, _x: number, _y: number) { /* no-op */ }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rect(_x: number, _y: number, _w: number, _h: number) { /* no-op */ }
  }

  (globalThis as Record<string, unknown>).Path2D = Path2DPolyfill;
}
