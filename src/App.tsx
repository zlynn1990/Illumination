import './App.css';
import React, { useEffect, useRef } from 'react';
import { CanvasWidth, CanvasHeight, RockBgData, IlluminationDepth } from './Constants';
import { traceLights, TraceResult } from './Renderers/RayTracer';
import { Lamp } from './LightSources/Lamp';
import { FpsManager } from './FpsManager';
import { renderLines, renderPolygons } from './Renderers/PrimativeRenderer';
import { Surface } from './Environment/Surface';
import { Light } from './LightSources/Light';
import { LightSource } from './LightSources/LightSource';
import { CursorLight } from './LightSources/CursorLight';
import { LineSegment } from './Primitives/LineSegment';
import { getBooleanFromQueryString } from './Utilities';
import { startBlur, fill, endBlur, overlayImage } from './Renderers/canvasHelper';
import { createBorderSurfaces } from './Environment/EnvironmentBuilder';

const topLamp = new Lamp({
  segment: { l1X: 505, l1Y: 35, l2X: 560, l2Y: 35 },
  minAngle: 2.3,
  maxAngle: 1,
  intensity: 0.8,
  emissionSegmentId: -1
});

// const topLamp = new Lamp({
//   segment: { l1X: 40, l1Y: 500, l2X: 40, l2Y: 500 },
//   a0: 2.3,
//   a1: 1,
//   intensity: 0.8,
//   emissionSegmentId: -1
// });

// const topLamp = new Lamp({
//   segment: { l1X: 600, l1Y: 420, l2X: 600, l2Y: 480 },
//   a0: 3.5,
//   a1: 2.5,
//   intensity: 0.8,
//   emissionSegmentId: -1
// });

const cursorLight = new CursorLight(1.9);

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

let surfaceSegments: Surface[] = createBorderSurfaces();

//surfaceSegments.push(movingSurface);

let lastTimeStamp = 0;

function render(timeStamp: number) {
  if (context === null) return;

  let deltaTime = timeStamp - lastTimeStamp;
  lastTimeStamp = timeStamp;

  cursorLight.rotate(deltaTime);

  // Clear the frame with black
  fill(context, '#090909');

  // Blur all light rendering for smoothness
  if (getBooleanFromQueryString('blur', 'true')) {
    startBlur(context, 5);
  }

  let lightSources: LightSource[] = [];
  let debugRays: Array<LineSegment[]> = [];
  let debugSources: LightSource[] = [];

  // Render the first set of light sources directly from defined lights
  lights.forEach(light => {
    lightSources.push(...light.generateSources());
  });

  // Trace the intial lights
  let result: TraceResult = traceLights(lightSources, surfaceSegments);

  if (getBooleanFromQueryString('debug', 'false')) {
    debugRays.push([...result.rays]);
    debugSources.push (...result.lightSources);
  }

  // Render initial light polygons
  renderPolygons(context, result.litPolygons);

  // Next continue tracing all resulting light sources up to the desired depth
  for (let i=1; i < IlluminationDepth; i++) {
    result = traceLights(result.lightSources, surfaceSegments);

    if (getBooleanFromQueryString('debug', 'false')) {
      debugRays.push([...result.rays]);
      debugSources.push (...result.lightSources);
    }

    renderPolygons(context, result.litPolygons);
  }

  if (getBooleanFromQueryString('blur', 'true')) {
    endBlur(context);
  }

  if (getBooleanFromQueryString('bg', 'true')) {
    overlayImage(context, rockBg);
  }

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

    renderLines(context, sourceSegments, '#42bb00', 5);
  }

  let rayCount = 0;

  for (let i=0; i < debugRays.length; i++) {
    rayCount += debugRays[i].length;
  }

  fpsManager.update(timeStamp);

  if (getBooleanFromQueryString('debug', 'false')) {
    let fps: number = fpsManager.Current;

    // Only 1 frame was requested
    if (!getBooleanFromQueryString('continuous', 'true')) {
      fps = 1;
    }

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
      cursorLight.updatePosition(event.clientX - outputCanvas.current.offsetLeft,
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
