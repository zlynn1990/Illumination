import { IntensityPoint, LitPolygon } from "../LightSources/LitPolygon";
import { LineSegment } from "../Primitives/LineSegment";

function colorFromIntensity(intensityPoint: IntensityPoint): string {
    const level = (intensityPoint.value / 1.0);

    return `rgba(255, 255, 255, ${level})`;
}

export function renderLines(context: CanvasRenderingContext2D, segments: LineSegment[], color: string, width: number) {
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = width;

    segments.forEach(segment => {
        context.moveTo(segment.p1.x, segment.p1.y);
        context.lineTo(segment.p2.x, segment.p2.y);
    });

    context.stroke();
}

export function renderPolygons(context: CanvasRenderingContext2D, litPolygons: LitPolygon[]) {
    litPolygons.forEach(polygon => {
        const gradient = context.createLinearGradient(polygon.maxIntensity.location.x, polygon.maxIntensity.location.y,
                                                      polygon.minIntensity.location.x, polygon.minIntensity.location.y);
        gradient.addColorStop(0, colorFromIntensity(polygon.maxIntensity));
        gradient.addColorStop(1, colorFromIntensity(polygon.minIntensity));
        context.fillStyle = gradient;

        // Valid polygon must have at least 3 points
        if (polygon.points && polygon.points.length > 2) {
            context.beginPath();
            context.moveTo(polygon.points[0].x, polygon.points[0].y);

            for (let i = 1; i < polygon.points.length; i++) {
                context.lineTo(polygon.points[i].x, polygon.points[i].y);
            }

            context.closePath();
            context.fill();
        }
    });
}