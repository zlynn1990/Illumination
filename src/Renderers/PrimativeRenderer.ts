import { LitPolygon } from "../LightSources/LitPolygon";
import { LineSegment } from "../Primitives/LineSegment";

export function RenderLines(context: CanvasRenderingContext2D, segments: LineSegment[], color: string) {
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = 1;

    segments.forEach(segment => {
        context.moveTo(segment.l1X, segment.l1Y);
        context.lineTo(segment.l2X, segment.l2Y);
    });

    context.stroke();
}

export function RenderPolygons(context: CanvasRenderingContext2D, litPolygons: LitPolygon[]) {
    context.fillStyle = '#FFFFFF';

    litPolygons.forEach(litPolygon => {
        context.globalAlpha = litPolygon.intensity;

        let polygon = litPolygon.polygon;

        context.beginPath();
        context.moveTo(polygon.x0, polygon.y0);
        context.lineTo(polygon.x1, polygon.y1);
        context.lineTo(polygon.x2, polygon.y2);
        context.lineTo(polygon.x3, polygon.y3);
        context.closePath();
        context.fill();
    });
}