import { LineSegment } from "../Primitives/LineSegment";

export interface LightSource {
    segment: LineSegment;

    p1Angle: number;
    p2Angle: number;

    intensity: number;

    emissionSurfaceId: number;
}