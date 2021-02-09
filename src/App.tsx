import './App.css';
import React, { useEffect, useRef } from 'react';
import { CanvasWidth, CanvasHeight, RockBgData, IlluminationDepth } from './Constants';
import { CreateBorderSurfaces } from './EnvironmentBuilder';
import { TraceLights, TraceResult } from './Renderers/RayTracer';
import { Lamp } from './LightSources/Lamp';
import { FpsManager } from './FpsManager';
import { RenderLines, RenderPolygons } from './Renderers/PrimativeRenderer';
import { SurfaceSegment } from './Primitives/SurfaceSegment';
import { Light } from './LightSources/Light';
import { LightSource } from './LightSources/LightSource';
import { CursorLight } from './LightSources/CursorLight';
import { LineSegment } from './Primitives/LineSegment';
import { getBooleanFromQueryString } from './Utilities';

const topLamp = new Lamp({
  segment: { l1X: 508, l1Y: 35, l2X: 560, l2Y: 35 },
  a0: 2.3,
  a1: 1.1,
  intensity: 1.0,
  emissionSegmentId: -1
});

const cursorLight = new CursorLight();

const lights = Array<Light>(topLamp, cursorLight);

const rockBg = new Image(600, 600);
rockBg.src = RockBgData;

let outputContext: CanvasRenderingContext2D | null;
let fpsManager = new FpsManager();

let surfaceSegments: Array<SurfaceSegment> = CreateBorderSurfaces();

function render(timeStamp: number) {
  if (outputContext === null) return;

  // Clear the frame with black
  outputContext.globalAlpha = 1.0;
  outputContext.globalCompositeOperation = 'source-over';
  outputContext.fillStyle = '#111111';
  outputContext.fillRect(0, 0, CanvasWidth, CanvasHeight);

  // Blur all light rendering for smoothness
  outputContext.filter = 'blur(5px)';

  let lightSources: LightSource[] = [];
  let sourceRays: Array<LineSegment[]> = [];

  // Render the first set of light sources directly from defined lights
  lights.forEach(light => {
    lightSources.push(...light.generateSources());
  });

  // Trace the lights
  let result: TraceResult = TraceLights(lightSources, surfaceSegments);
  sourceRays.push([...result.rays]);

  RenderPolygons(outputContext, result.litPolygons);

  // Next continue this operation for until the desired depth
  for (let i=1; i < IlluminationDepth; i++) {
    result = TraceLights(result.lightSources, surfaceSegments);
    sourceRays.push([...result.rays]);

    RenderPolygons(outputContext, result.litPolygons);
  }

  outputContext.filter = 'none';

  outputContext.globalAlpha = 1.0;
  outputContext.globalCompositeOperation = 'multiply';
  outputContext.drawImage(rockBg, 0, 0);

  outputContext.globalAlpha = 1.0;
  outputContext.globalCompositeOperation = 'source-over';

  // Debug line rendering
  if (getBooleanFromQueryString('debug', 'false')) {
    for (let i=0; i < sourceRays.length; i++) {
      let hslColor: string = `hsl(${(i * 70) % 360}, 100%, 50%)`;

      RenderLines(outputContext, sourceRays[i], hslColor);
    }
  }

  let rayCount = 0;

  for (let i=0; i < sourceRays.length; i++) {
    rayCount += sourceRays[i].length;
  }

  fpsManager.update(timeStamp);

  const fps: number = fpsManager.Current;

  outputContext.globalAlpha = 1.0;
  outputContext.globalCompositeOperation = 'source-over';

  outputContext.font = "20px Georgia";
  outputContext.fillStyle = "white";
  outputContext.fillText(`FPS: ${fps}`, 10, 30);
  outputContext.fillText(`Rays: ${(rayCount * fps).toLocaleString()} / s`, 10, 60);

  window.requestAnimationFrame(render);
}

function App() {
  const outputCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (outputCanvas.current) {
      outputContext = outputCanvas.current.getContext('2d');
      if (outputContext) {
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
