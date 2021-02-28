import { Point } from "../Primitives/Point";
import { Angle } from "./Angle";
import { Ray } from "../Primitives/Ray";
import { RayHelper } from "./RayHelper";
import { LineSegment } from "../Primitives/LineSegment";
import { LightSource } from "../LightSources/LightSource";
import { SegmentHelper } from "./SegmentHelper";
import { Surface } from "../Environment/Surface";

export class LightHelper {
    static IntensityFalloff: number = 0.002;

    static Origin(source: LightSource): Point | undefined {
        const segment: LineSegment = source.segment;

        const reversedMin: Ray = {
            origin: segment.p1,
            angle: Angle.Reverse(source.p1Angle)
        };
    
        const reversedMax: Ray = {
            origin: segment.p2,
            angle: Angle.Reverse(source.p2Angle)
        }
    
        return RayHelper.Intersection(reversedMin, reversedMax);
    }

    static Intensity(source: LightSource, distance: number): number {
        if (distance <= 0) {
            return source.intensity;
        }
    
        const linearFalloff = source.intensity - distance * this.IntensityFalloff;
    
        return Math.max(Math.min(1.0, linearFalloff), 0);
    }

    static MinimumIntensityPoint(source: LightSource, surfaces: Surface[]): Point {
        const sourceCenter = SegmentHelper.Center(source.segment);
        
        const maxDistance = source.intensity / this.IntensityFalloff;

        return {
            x: sourceCenter.x + surfaces[source.emissionSurfaceId].normal.x * maxDistance,
            y: sourceCenter.y + surfaces[source.emissionSurfaceId].normal.y * maxDistance,
        };
    }
}