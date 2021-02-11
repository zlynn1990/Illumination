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
    litPolygons.forEach(litPolygon => {
        context.fillStyle = "#ffffff";
        context.globalAlpha = litPolygon.intensity;    

        // Valid polygon must have at least 3 points
        if (litPolygon.points && litPolygon.points.length > 2) {
            context.beginPath();
            context.moveTo(litPolygon.points[0].x, litPolygon.points[0].y);

            for (let i=1; i < litPolygon.points.length; i++) {
                context.lineTo(litPolygon.points[i].x, litPolygon.points[i].y);
            }

            context.closePath();
            context.fill();
        }
    });
}