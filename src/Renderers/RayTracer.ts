import { RaysPerAngle } from "../Constants";
import { LightSource } from "../LightSources/LightSource";
import { LitPolygon } from "../LightSources/LitPolygon";
import { LineSegment } from "../Primitives/LineSegment";
import { Ray } from "../Primitives/Ray";
import { SurfaceSegment } from "../Primitives/SurfaceSegment";

const MinDistance = 0.01;
const MinRaysPerSource = 10;

interface RayHit {
    x: number;
    y: number;

    perpX: number;
    perpY: number;

    segmentId: number;
}

export interface TraceResult {
    rays: LineSegment[],
    litPolygons: LitPolygon[],
    lightSources: LightSource[]
}

export function TraceLights(lightSources: LightSource[], surfaceSegments: SurfaceSegment[]): TraceResult {
    let result: TraceResult = {
        rays: [],
        litPolygons: [],
        lightSources: []
    };

    lightSources.forEach(source => {
        let segment: LineSegment = source.segment;

        const lightRange = source.a1 - source.a0;

        const rayCount = Math.max(Math.round(Math.abs(lightRange)) * RaysPerAngle, MinRaysPerSource);

        // Position increments for each ray origin along the segment
        let incX: number = (segment.l2X - segment.l1X) / rayCount;
        let incY: number = (segment.l2Y - segment.l1Y) / rayCount;

        // Angle increments for each ray direction along the segment
        let angleInc = lightRange / rayCount;

        let lastRay: Ray = { oX: 0, oY: 0, dX: 0, dY: 0, intensity: 0, emissionSegmentId: -1 };
        let firstHit: RayHit = { x: 0, y: 0, perpX: 0, perpY: 0, segmentId: -1 };
        let lastHit: RayHit = { x: 0, y: 0, perpX: 0, perpY: 0, segmentId: -1 };

        // Draw n rays from the source light and
        for (let i = 0; i < rayCount; i++) {
            let angle: number = source.a0 + angleInc * i;

            let ray: Ray = {
                oX: segment.l1X + incX * i,
                oY: segment.l1Y + incY * i,
                dX: Math.cos(angle),
                dY: Math.sin(angle),
                intensity: source.intensity,
                emissionSegmentId: source.emissionSegmentId
            };

            let rayHit: RayHit = TraceRay(ray, surfaceSegments);

            // Ray hit was valid
            if (rayHit.x >= 0) {
                result.rays.push({ l1X: ray.oX, l1Y: ray.oY, l2X: rayHit.x, l2Y: rayHit.y });

                // If the current hit differs in segment from the last hit or its the last ray form a new lit polygon
                if (rayHit.segmentId !== lastHit.segmentId || i === RaysPerAngle - 1) {
                    // Check to see if the the last two hits share a point
                    if (lastHit.segmentId >= 0) {
                        const lastSegment = surfaceSegments[lastHit.segmentId];
                        const currentSegment = surfaceSegments[rayHit.segmentId];

                        if (Math.abs(lastSegment.l1X - currentSegment.l1X) < MinDistance) {
                            if (Math.abs(lastSegment.l1Y - lastSegment.l1Y)) {

                            }
                        }
                    }
                    if (lastRay.intensity > 0) {
                        result.litPolygons.push({
                            intensity: ray.intensity,
                            color: '#FFFFF',
                            polygon: {
                                x0: lastRay.oX,
                                y0: lastRay.oY,
                                x1: ray.oX,
                                y1: ray.oY,
                                x2: lastHit.x,
                                y2: lastHit.y,
                                x3: firstHit.x,
                                y3: firstHit.y
                            }
                        });

                        result.lightSources.push({
                            segment: {
                                l1X: firstHit.x,
                                l1Y: firstHit.y,
                                l2X: lastHit.x,
                                l2Y: lastHit.y
                            },
                            intensity: ray.intensity * 0.25,
                            a0: Math.atan2(firstHit.perpY, firstHit.perpX),
                            a1: Math.atan2(lastHit.perpY, lastHit.perpX),
                            emissionSegmentId: lastHit.segmentId
                        })
                    }

                    // Update the last hit to the new segment
                    firstHit = { ...rayHit };
                    lastRay = { ...ray };
                }

                lastHit = { ...rayHit };
            }
        }
    });

    return result;
}

function TraceRay(ray: Ray, surfaceSegments: SurfaceSegment[]): RayHit {
    // Closest segment stats
    let cDist: number = 100000000;
    let cPerpX: number = -1;
    let cPerpY: number = -1;
    let cSegment: number = -1;

    let hitableSegmentIds: number[] = [];

    // The ray was emitted from a surface
    if (ray.emissionSegmentId >= 0) {
        hitableSegmentIds.push(...surfaceSegments[ray.emissionSegmentId].hitableSegmentIds);
    } else { // Otherwise assume all surfaces are hitable
        for (let i=0; i < surfaceSegments.length; i++) {
            hitableSegmentIds.push(i);
        }
    }

    // Intersection algorithm http://ahamnett.blogspot.com/2012/06/raypolygon-intersections.html
    for (let i = 0; i < hitableSegmentIds.length; i++) {
        let surface: SurfaceSegment = surfaceSegments[hitableSegmentIds[i]];

        let segX: number = surface.l2X - surface.l1X;
        let segY: number = surface.l2Y - surface.l1Y;

        // Vertical optmization
        if (segX === 0) {
            let perpDot: number = ray.dX * segY;

            let dX: number = surface.l1X - ray.oX;
            let dY: number = surface.l1Y - ray.oY;

            let t: number = (segY * dX) / perpDot;

            // The ray is minimal length and closer than all other hits
            if (t > MinDistance && t < cDist) {
                let s: number = (ray.dY * dX + -ray.dX * dY) / perpDot;

                // The ray is valid on the segment
                if (s >= 0 && s <= 1) {
                    cDist = t;
                    cPerpX = -ray.dX;
                    cPerpY = ray.dY;
                    cSegment = hitableSegmentIds[i];
                }
            }
        } else if (segY === 0) { // Horizontal optimziation
            let perpDot: number = ray.dY * -segX;

            let dX: number = surface.l1X - ray.oX;
            let dY: number = surface.l1Y - ray.oY;

            let t: number = (-segX * dY) / perpDot;

            // The ray is minimal length and closer than all other hits
            if (t > MinDistance && t < cDist) {
                let s = (ray.dY * dX + -ray.dX * dY) / perpDot;

                // The ray is valid on the segment
                if (s >= 0 && s <= 1) {
                    cDist = t;
                    cPerpX = ray.dX;
                    cPerpY = -ray.dY;
                    cSegment = hitableSegmentIds[i];
                }
            }
        } else { // Arbitrary Segment
            let segPerpX: number = segY;
            let segPerpY: number = -segX;

            let perpDot: number = ray.dX * segPerpX + ray.dY * segPerpY;

            // Ignore parallel lines
            if (Math.abs(perpDot) > MinDistance) {
                let dX: number = surface.l1X - ray.oX;
                let dY: number = surface.l1Y - ray.oY;

                let t: number = (segPerpX * dX + segPerpY * dY) / perpDot;
                let s: number = (ray.dY * dX + -ray.dX * dY) / perpDot;

                // The ray is a valid hit
                if (t > MinDistance && s >= 0 && s <= 1) {
                    // The hit is closer than all other segments
                    if (t < cDist) {
                        cDist = t;
                        cSegment = hitableSegmentIds[i];
                    }
                }
            }
        }
    };

    // Valid hit
    if (cDist < 100000000) {
        return {
            x: Math.max(ray.oX + ray.dX * cDist, 0),
            y: Math.max(ray.oY + ray.dY * cDist, 0),
            perpX: cPerpX,
            perpY: cPerpY,
            segmentId: cSegment
        };
    }

    return { x: -100, y: -100, perpX: -100, perpY: -100, segmentId: -1 };
}