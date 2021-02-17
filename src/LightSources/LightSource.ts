import { LineSegment } from "../Primitives/LineSegment";

export interface LightSource {
    segment: LineSegment;

    minAngle: number;
    maxAngle: number;

    intensity: number;

    emissionSegmentId: number;
}