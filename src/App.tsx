import './App.css';
import React, { useEffect, useRef } from 'react';
import { CanvasWidth, CanvasHeight, RockBgData, IlluminationDepth } from './Constants';
import { CreateBorderSurfaces } from './EnvironmentBuilder';
import { TraceLights, TraceResult } from './Renderers/RayTracer';
import { Lamp } from './LightSources/Lamp';
import { FpsManager } from './FpsManager';
import { renderLines, renderPolygons } from './Renderers/PrimativeRenderer';
import { SurfaceSegment } from './Primitives/SurfaceSegment';
import { Light } from './LightSources/Light';
import { LightSource } from './LightSources/LightSource';
import { CursorLight } from './LightSources/CursorLight';
import { LineSegment } from './Primitives/LineSegment';
import { getBooleanFromQueryString, getStringFromQueryString } from './Utilities';

const topLamp = new Lamp({
  segment: { l1X: 505, l1Y: 35, l2X: 560, l2Y: 35 },
  a0: 2.3,
  a1: 1,
  intensity: 0.8,
  emissionSegmentId: -1
});

const cursorLight = new CursorLight(1);

const lights: Light[] = [];

if (getBooleanFromQueryString('lamp', 'true')) {
  lights.push(topLamp);
}

if (getBooleanFromQueryString('cursor', 'true')) {
  lights.push(cursorLight);
}

const rockBg = new Image(600, 600);
rockBg.src = RockBgData;

let context: CanvasRenderingContext2D | null;
let fpsManager = new FpsManager();

let surfaceSegments: Array<SurfaceSegment> = CreateBorderSurfaces();

function render(timeStamp: number) {
  if (context === null) return;

  // Clear the frame with black
  context.globalAlpha = 1.0;
  context.globalCompositeOperation = 'source-over';
  context.fillStyle = '#0d0d0d';
  context.fillRect(0, 0, CanvasWidth, CanvasHeight);

  // Blur all light rendering for smoothness
  if (getBooleanFromQueryString('blur', 'true')) {
    context.filter = 'blur(4px)';
  }

  let lightSources: LightSource[] = [];
  let debugRays: Array<LineSegment[]> = [];
  let debugSources: LightSource[] = [];

  // Render the first set of light sources directly from defined lights
  lights.forEach(light => {
    lightSources.push(...light.generateSources());
  });

  // Trace the lights
  let result: TraceResult = TraceLights(lightSources, surfaceSegments);

  if (getBooleanFromQueryString('debug', 'false')) {
    debugRays.push([...result.rays]);
    debugSources.push (...result.lightSources);
  }

  context.globalCompositeOperation = getStringFromQueryString('polygonCompositeMode', 'source-over');

  renderPolygons(context, result.litPolygons);

  // Next continue this operation for until the desired depth
  for (let i=1; i < IlluminationDepth; i++) {
    result = TraceLights(result.lightSources, surfaceSegments);

    if (getBooleanFromQueryString('debug', 'false')) {
      debugRays.push([...result.rays]);
      debugSources.push (...result.lightSources);
    }

    renderPolygons(context, result.litPolygons);
  }

  context.filter = 'none';

  if (getBooleanFromQueryString('bg', 'true')) {
    context.globalAlpha = 1.0;
    context.globalCompositeOperation = getStringFromQueryString('bgCompositeMode', 'overlay');
    context.drawImage(rockBg, 0, 0);
  }

  context.globalAlpha = 1.0;
  context.globalCompositeOperation = 'source-over';

  // Debug line rendering
  if (getBooleanFromQueryString('debug', 'false')) {
    for (let i=0; i < debugRays.length; i++) {
      let hslColor: string = `hsl(${(i * 70) % 360}, 100%, 50%)`;

      renderLines(context, debugRays[i], hslColor, 0.5);
    }

    let sourceSegments: LineSegment[] = [];

    for (let i=0; i < debugSources.length; i++) {
      sourceSegments.push(debugSources[i].segment);
    }

    renderLines(context, sourceSegments, '#42bb00', 7);
  }

  let rayCount = 0;

  for (let i=0; i < debugRays.length; i++) {
    rayCount += debugRays[i].length;
  }

  fpsManager.update(timeStamp);

  const fps: number = fpsManager.Current;

  if (getBooleanFromQueryString('debug', 'false')) {
    context.font = "20px Georgia";
    context.fillStyle = "white";
    context.fillText(`FPS: ${fps}`, 10, 30);
    context.fillText(`Rays: ${(rayCount * fps).toLocaleString()} / s`, 10, 60);
  }

  // Keep rendering continously unless specified otherwise
  if (getBooleanFromQueryString('continuous', 'true')) {
    window.requestAnimationFrame(render);
  }
}

function App() {
  const outputCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (outputCanvas.current) {
      context = outputCanvas.current.getContext('2d');
      if (context) {
        window.requestAnimationFrame(render);
      }
    }
  }, [outputCanvas]);

  function onMouseMove(event: { clientX: number; clientY: number; }) {
    if (outputCanvas.current) {
      cursorLight.Update(event.clientX - outputCanvas.current.offsetLeft,
        event.clientY - outputCanvas.current.offsetTop);
    }
  }

  return (
    <div className="App">
      <canvas ref={outputCanvas} width={CanvasWidth} height={CanvasHeight} onMouseMove={onMouseMove} />
    </div>
  );
}

export default App;
