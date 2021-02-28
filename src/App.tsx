import './App.css';
import React, { useEffect, useRef } from 'react';
import { CanvasWidth, CanvasHeight, RockBgData } from './Constants';
import { traceLights, TraceResult } from './Renderers/RayTracer';
import { Lamp } from './LightSources/Lamp';
import { FpsManager } from './FpsManager';
import { renderLines, renderPolygons } from './Renderers/PrimitiveRenderer';
import { Surface } from './Environment/Surface';
import { Light } from './LightSources/Light';
import { LightSource } from './LightSources/LightSource';
import { CursorLight } from './LightSources/CursorLight';
import { LineSegment } from './Primitives/LineSegment';
import { getBooleanFromQueryString, getNumberFromQueryString } from './Utilities';
import { startBlur, fill, endBlur, overlayImage } from './Renderers/CanvasHelper';
import { createBorderSurfaces } from './Environment/EnvironmentBuilder';

let surfaces: Surface[] = createBorderSurfaces();

let cursorLight: CursorLight | undefined = undefined;

const lights: Light[] = [];

if (getBooleanFromQueryString('lamp', 'true')) {
  const lampSurface: Surface = {
    id: surfaces.length,
    normal: { x: 0, y: 1 },
    segment: { p1: { x: 505, y: 35 }, p2: { x: 565, y: 35 } }
  }

  surfaces.push(lampSurface);
  lights.push(new Lamp(lampSurface, 2.3, 0.8, 1));
}

if (getBooleanFromQueryString('cursor', 'true')) {
  cursorLight = new CursorLight(25, 25, surfaces);
  lights.push(cursorLight);
}

const rockBg = new Image(600, 600);
rockBg.src = RockBgData;

let context: CanvasRenderingContext2D | null;
let fpsManager = new FpsManager();

let lastTimeStamp = 0;

function render(timeStamp: number) {
  if (context === null) return;

  let deltaTime = timeStamp - lastTimeStamp;
  lastTimeStamp = timeStamp;

  // Clear the frame with black
  fill(context, '#090909');

  // Blur all light rendering for smoothness
  if (getBooleanFromQueryString('blur', 'true')) {
    startBlur(context, 3);
  }

  let totalRays: number = 0;
  let lightSources: LightSource[] = [];

  let debugRays: Array<LineSegment[]> = [];
  let debugSources: LightSource[] = [];

  // Render the first set of light sources directly from defined lights
  lights.forEach(light => {
    lightSources.push(...light.generateSources());

    debugSources.push(...lightSources);
  });

  // Trace the initial lights
  let result: TraceResult = traceLights(lightSources, surfaces);

  if (getBooleanFromQueryString('debug', 'false')) {
    totalRays += result.totalRays;

    debugRays.push([...result.visibleRays]);
    debugSources.push(...result.lightSources);
  }

  // Render initial light polygons
  renderPolygons(context, result.litPolygons);

  const illuminationDepth: number = getNumberFromQueryString('depth', 2);

  // Next continue tracing all resulting light sources up to the desired depth
  for (let i = 1; i < illuminationDepth; i++) {
    result = traceLights(result.lightSources, surfaces);

    if (getBooleanFromQueryString('debug', 'false')) {
      totalRays += result.totalRays;

      debugRays.push([...result.visibleRays]);
      debugSources.push(...result.lightSources);
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
    for (let i = 0; i < debugRays.length; i++) {
      let hslColor: string = `hsl(${(i * 70) % 360}, 100%, 50%)`;

      renderLines(context, debugRays[i], hslColor, 0.5);
    }

    let sourceSegments: LineSegment[] = [];

    for (let i = 0; i < debugSources.length; i++) {
      sourceSegments.push(debugSources[i].segment);
    }

    renderLines(context, sourceSegments, '#42bb00', 5);
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
    context.fillText(`Rays: ${(totalRays * fps).toLocaleString()} / s`, 10, 60);
  }

  // Keep rendering continuously unless specified otherwise
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
      if (cursorLight !== undefined) {
        cursorLight.update({
          x: event.clientX - outputCanvas.current.offsetLeft,
          y: event.clientY - outputCanvas.current.offsetTop
        });
      }
    }
  }

  return (
    <div className="App">
      <canvas ref={outputCanvas} width={CanvasWidth} height={CanvasHeight} onMouseMove={onMouseMove} />
    </div>
  );
}

export default App;
