'use client';

import { useEffect, useRef, useState } from 'react';
import Terminal from '@/components/Terminal';
import type { Application, SplineEvent } from '@splinetool/runtime';

type SplineComponent = typeof import('@splinetool/react-spline').default;

type ScreenRect = { left: number; top: number; width: number; height: number };

type Mat4 = { elements: ArrayLike<number> };

type Attr = {
  count: number;
  getX: (index: number) => number;
  getY: (index: number) => number;
  getZ: (index: number) => number;
};

type SceneMesh = {
  geometry?: { attributes?: { position?: Attr; normal?: Attr } };
  matrixWorld: Mat4;
  updateMatrixWorld?: (force?: boolean) => void;
  updateWorldMatrix?: (updateParents: boolean, updateChildren: boolean) => void;
  traverse?: (callback: (object: SceneMesh) => void) => void;
};

type SplineApp = Application & {
  _camera?: {
    matrixWorld: Mat4;
    matrixWorldInverse: Mat4;
    projectionMatrix: Mat4;
    updateMatrixWorld?: (force?: boolean) => void;
    updateWorldMatrix?: (updateParents: boolean, updateChildren: boolean) => void;
    updateProjectionMatrix?: () => void;
  };
  _scene?: { getObjectByName: (name: string) => SceneMesh | undefined };
  _renderer?: { pipeline?: { setWatermark?: (texture: null) => void } };
};

function collectMeshes(object: SceneMesh | undefined) {
  const meshes: SceneMesh[] = [];
  if (!object) return meshes;
  const visit = (node: SceneMesh) => {
    if (node.geometry?.attributes?.position) meshes.push(node);
  };
  visit(object);
  object.traverse?.((node) => {
    if (node !== object) visit(node);
  });
  return meshes;
}

function fallbackScreenRect(host: HTMLElement): ScreenRect {
  const width = host.clientWidth;
  const height = host.clientHeight;
  return {
    left: width * 0.285,
    top: height * 0.18,
    width: width * 0.47,
    height: height * 0.55,
  };
}

function measureLaptopScreen(spline: SplineApp, host: HTMLElement): ScreenRect | null {
  const camera = spline._camera;
  const laptop = spline._scene?.getObjectByName('laptop');
  if (!camera || !laptop) return null;

  camera.updateMatrixWorld?.(true);
  camera.updateWorldMatrix?.(true, false);
  camera.updateProjectionMatrix?.();
  if (!camera.matrixWorld?.elements || !camera.matrixWorldInverse?.elements || !camera.projectionMatrix?.elements) {
    return null;
  }

  const lookX = -camera.matrixWorld.elements[8];
  const lookY = -camera.matrixWorld.elements[9];
  const lookZ = -camera.matrixWorld.elements[10];
  const view = camera.matrixWorldInverse.elements;
  const proj = camera.projectionMatrix.elements;
  const canvasRect = spline.canvas.getBoundingClientRect();
  const hostRect = host.getBoundingClientRect();
  const points: Array<{ x: number; y: number }> = [];

  for (const mesh of collectMeshes(laptop)) {
    mesh.updateMatrixWorld?.(true);
    mesh.updateWorldMatrix?.(true, false);
    const position = mesh.geometry?.attributes?.position;
    const normal = mesh.geometry?.attributes?.normal;
    const world = mesh.matrixWorld.elements;
    if (!position) continue;

    for (let index = 0; index < position.count; index++) {
      const x = position.getX(index);
      const y = position.getY(index);
      const z = position.getZ(index);
      const wx = world[0] * x + world[4] * y + world[8] * z + world[12];
      const wy = world[1] * x + world[5] * y + world[9] * z + world[13];
      const wz = world[2] * x + world[6] * y + world[10] * z + world[14];

      if (normal) {
        let nx = world[0] * normal.getX(index) + world[4] * normal.getY(index) + world[8] * normal.getZ(index);
        let ny = world[1] * normal.getX(index) + world[5] * normal.getY(index) + world[9] * normal.getZ(index);
        let nz = world[2] * normal.getX(index) + world[6] * normal.getY(index) + world[10] * normal.getZ(index);
        const length = Math.hypot(nx, ny, nz) || 1;
        nx /= length;
        ny /= length;
        nz /= length;
        if (nx * lookX + ny * lookY + nz * lookZ > -0.7) continue;
      }

      const vx = view[0] * wx + view[4] * wy + view[8] * wz + view[12];
      const vy = view[1] * wx + view[5] * wy + view[9] * wz + view[13];
      const vz = view[2] * wx + view[6] * wy + view[10] * wz + view[14];
      const vw = view[3] * wx + view[7] * wy + view[11] * wz + view[15];
      const cx = proj[0] * vx + proj[4] * vy + proj[8] * vz + proj[12] * vw;
      const cy = proj[1] * vx + proj[5] * vy + proj[9] * vz + proj[13] * vw;
      const cw = proj[3] * vx + proj[7] * vy + proj[11] * vz + proj[15] * vw;
      if (!cw) continue;

      points.push({
        x: canvasRect.left - hostRect.left + ((cx / cw) * 0.5 + 0.5) * canvasRect.width,
        y: canvasRect.top - hostRect.top + ((-cy / cw) * 0.5 + 0.5) * canvasRect.height,
      });
    }
  }

  if (points.length < 4) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  const width = maxX - minX;
  const sidePoints = points.filter((point) => point.x < minX + width * 0.18 || point.x > maxX - width * 0.18);
  const frameTop = Math.min(...sidePoints.map((point) => point.y));
  const frameBottom = Math.max(...sidePoints.map((point) => point.y));
  const frameHeight = frameBottom - frameTop;
  if (width < 40 || frameHeight < 40) return null;

  // Front-facing bounds are the screen image, not the cyan bezel.
  return { left: minX, top: frameTop, width, height: frameHeight };
}

function BootScreen({ done }: { done: boolean }) {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (done) {
      setProgress(100);
      const fade = window.setTimeout(() => setFading(true), 180);
      const hide = window.setTimeout(() => setHidden(true), 580);
      return () => {
        window.clearTimeout(fade);
        window.clearTimeout(hide);
      };
    }

    const start = performance.now();
    const timer = window.setInterval(() => {
      const value = 92 * (1 - Math.exp(-(performance.now() - start) / 1400));
      setProgress(value);
    }, 50);
    return () => window.clearInterval(timer);
  }, [done]);

  if (hidden) return null;

  return (
    <div
      aria-live="polite"
      aria-busy={!done}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        background: '#0a0a0a',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
        transition: 'opacity 0.4s ease',
      }}
    >
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        style={{ width: 'min(16rem, 70vw)', height: 2, background: '#1f1f1f' }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: '#00ff00',
            boxShadow: '0 0 8px #00ff00',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
          fontSize: '0.75rem',
          letterSpacing: '0.08em',
          color: '#00ff00',
        }}
      >
        {Math.round(progress)}%
      </span>
    </div>
  );
}

export default function Home() {
  const [showTerminal, setShowTerminal] = useState(false);
  const [screenRect, setScreenRect] = useState<ScreenRect | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const isZoomedRef = useRef(false);
  const cameraZoomedRef = useRef(false);
  const splineRef = useRef<SplineApp | null>(null);
  const hostRef = useRef<HTMLElement>(null);
  const frameRef = useRef(0);
  const openTimerRef = useRef(0);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [SplineView, setSplineView] = useState<SplineComponent | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinElapsed(true), 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const apply = () => setIsMobile(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (isMobile !== false) return;
    let cancelled = false;
    import('@splinetool/react-spline').then((mod) => {
      if (!cancelled) setSplineView(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [isMobile]);

  function updateScreenRect() {
    const spline = splineRef.current;
    const host = hostRef.current;
    if (!spline || !host) return;
    const next = measureLaptopScreen(spline, host) ?? fallbackScreenRect(host);
    const fitted =
      next.width > host.clientWidth * 0.2 && next.width < host.clientWidth * 0.9 ? next : fallbackScreenRect(host);
    setScreenRect((current) => {
      if (
        current &&
        Math.abs(current.left - fitted.left) < 0.5 &&
        Math.abs(current.top - fitted.top) < 0.5 &&
        Math.abs(current.width - fitted.width) < 0.5 &&
        Math.abs(current.height - fitted.height) < 0.5
      ) {
        return current;
      }
      return fitted;
    });
  }

  function trackScreen() {
    cancelAnimationFrame(frameRef.current);
    const loop = () => {
      updateScreenRect();
      if (isZoomedRef.current) frameRef.current = requestAnimationFrame(loop);
    };
    loop();
  }

  useEffect(
    () => () => {
      cancelAnimationFrame(frameRef.current);
      window.clearTimeout(openTimerRef.current);
    },
    [],
  );

  function hideTerminal() {
    window.clearTimeout(openTimerRef.current);
    isZoomedRef.current = false;
    setShowTerminal(false);
    cancelAnimationFrame(frameRef.current);
  }

  function handleSplineMouseDown(e: SplineEvent) {
    if (e.target.name !== 'laptop') return;

    if (cameraZoomedRef.current) {
      cameraZoomedRef.current = false;
      hideTerminal();
      return;
    }

    cameraZoomedRef.current = true;
    openTimerRef.current = window.setTimeout(() => {
      if (!cameraZoomedRef.current) return;
      isZoomedRef.current = true;
      setShowTerminal(true);
      trackScreen();
    }, 1500);
  }

  const bootDone = isMobile === true ? minElapsed : minElapsed && sceneReady;

  return (
    <main
      ref={hostRef}
      className={`relative h-dvh w-full overflow-hidden ${isMobile ? 'bg-[#0a0a0a]' : 'bg-[#1A1A1A]'}`}
    >
      {isMobile ? (
        <Terminal active onQuit={() => undefined} />
      ) : (
        <>
          {SplineView && (
            <SplineView
              scene="https://prod.spline.design/GM2ro768woK11CoN/scene.splinecode"
              onLoad={(spline) => {
                const app = spline as SplineApp;
                splineRef.current = app;
                app._renderer?.pipeline?.setWatermark?.(null);
                app.requestRender();
                setSceneReady(true);
              }}
              onSplineMouseDown={handleSplineMouseDown}
            />
          )}

          <div
            className={`terminal-overlay absolute z-10 overflow-hidden transition-opacity duration-500 ${
              showTerminal ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            style={
              screenRect
                ? {
                    left: screenRect.left,
                    top: screenRect.top,
                    width: screenRect.width,
                    height: screenRect.height,
                    borderRadius: Math.min(screenRect.width, screenRect.height) * 0.07,
                  }
                : { left: 0, top: 0, width: 0, height: 0 }
            }
          >
            <Terminal active={showTerminal} onQuit={hideTerminal} />
          </div>
        </>
      )}
      <BootScreen done={bootDone} />
    </main>
  );
}
