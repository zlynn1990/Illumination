import { LineSegment } from "../Primitives/LineSegment";

export interface LightSource {
    segment: LineSegment;

    a0: number;
    a1: number;

    intensity: number;

    emissionSegmentId: number;
}