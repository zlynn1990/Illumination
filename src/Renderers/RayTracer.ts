import { RaysPerAngle } from "../Constants";
import { LightSource } from "../LightSources/LightSource";
import { IntensityPoint, LitPolygon } from "../LightSources/LitPolygon";
import { LineSegment } from "../Primitives/LineSegment";
import { Point } from "../Primitives/Point";
import { Ray } from "../Primitives/Ray";
import { SurfaceSegment } from "../Primitives/SurfaceSegment";

const MinDistance = 0.001;
const MinRaysPerSource = 40;

interface RayHit {
    x: number;
    y: number;

    distance: number;

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
        const segment: LineSegment = source.segment;

        // All the points that fill form this lit polygon starting with the first
        const polygonPoints: Point[] = [{ x: segment.l1X, y: segment.l1Y }];

        // Max spread of the light source between its angles
        const lightSpread = source.a1 - source.a0;

        const rayCount = Math.max(Math.round(Math.abs(lightSpread)) * RaysPerAngle, MinRaysPerSource);

        // Position increments for each ray origin along the segment
        const incX: number = (segment.l2X - segment.l1X) / rayCount;
        const incY: number = (segment.l2Y - segment.l1Y) / rayCount;

        // Angle increments for each ray direction along the segment
        const angleInc = lightSpread / rayCount;

        // The first and last hits for any new segment
        let firstHit: RayHit = { x: 0, y: 0, distance: 0, perpX: 0, perpY: 0, segmentId: -1 };
        let lastHit: RayHit = { x: 0, y: 0, distance: 0, perpX: 0, perpY: 0, segmentId: -1 };

        // The furthest ray hit from this polygon
        let maxRayHit: RayHit = { x: 0, y: 0, perpX: 0, perpY: 0, distance: 0, segmentId: -1 };

        // Draw n rays from the source light
        for (let i = 0; i < rayCount; i++) {
            const ray: Ray = {
                oX: segment.l1X + incX * i,
                oY: segment.l1Y + incY * i,
                dX: Math.cos(source.a0 + angleInc * i),
                dY: Math.sin(source.a0 + angleInc * i),
                intensity: source.intensity,
                emissionSegmentId: source.emissionSegmentId
            };

            const rayHit: RayHit = traceRay(ray, surfaceSegments);

            // Ray hit was valid
            if (rayHit.x >= 0) {
                result.rays.push({ l1X: ray.oX, l1Y: ray.oY, l2X: rayHit.x, l2Y: rayHit.y });

                if (rayHit.distance > maxRayHit.distance) {
                    maxRayHit = { ...rayHit };
                }

                // The ray has hit a different surface
                if (rayHit.segmentId !== lastHit.segmentId) {
                    if (lastHit.segmentId >= 0) {
                        const lastSegment = surfaceSegments[lastHit.segmentId];
                        const currentSegment = surfaceSegments[rayHit.segmentId];

                        const connection: Point = testConnection(lastSegment, currentSegment);

                        // If there is a direct connection ensure the lighting is continous
                        if (connection.x >= 0 && i !== RaysPerAngle - 1) {
                            polygonPoints.push(connection);

                            // Update the current and last ray hits to the new connected location
                            rayHit.x = connection.x;
                            rayHit.y = connection.y;
                            lastHit.x = connection.x;
                            lastHit.y = connection.y;
                        } else { // Otherwise move to the edges of both segments to ensure continous lighting with little overlap
                            const rayOrigin: Point = { x: ray.oX, y: ray.oY };

                            const closestLastSegmentEdge: Point = closestEdge(lastSegment, { x: rayHit.x, y: rayHit.y });

                            // If the hit is further than the edge, check if the edge is visible to the source
                            if (rayHit.distance > distance(closestLastSegmentEdge.x, closestLastSegmentEdge.y, rayOrigin.x, rayOrigin.y)) {
                                if (isVisible(closestLastSegmentEdge, rayOrigin, surfaceSegments)) {
                                    polygonPoints.push(closestLastSegmentEdge);

                                    // Update the last hit to this point
                                    lastHit.x = closestLastSegmentEdge.x;
                                    lastHit.y = closestLastSegmentEdge.y;
                                }
                            } else { // Otherwise check if the closest edge on the new surface is visible to the source
                                const closestCurrentEdgeSegement = closestEdge(currentSegment, { x: rayHit.x, y: rayHit.y });

                                if (isVisible(closestCurrentEdgeSegement, rayOrigin, surfaceSegments)) {
                                    polygonPoints.push({ x: lastHit.x, y: lastHit.y });
                                    polygonPoints.push(closestCurrentEdgeSegement);

                                    // Update the current ray hit to this location
                                    rayHit.x = closestCurrentEdgeSegement.x;
                                    rayHit.y = closestCurrentEdgeSegement.y;
                                } else {
                                    polygonPoints.push({ x: lastHit.x, y: lastHit.y });
                                }
                            }

                            polygonPoints.push({ x: rayHit.x, y: rayHit.y });
                        }

                        // Create a light source from the last point until the connection
                        result.lightSources.push(generateLightSource(firstHit, lastHit, ray.intensity));
                    } else { // Otherwise register the first hit
                        polygonPoints.push({ x: rayHit.x, y: rayHit.y });
                    }

                    // Update the last hit to the new segment
                    firstHit = { ...rayHit };
                }

                lastHit = { ...rayHit };
            }
        }

        // Add the last hit to the polygon
        polygonPoints.push({ x: lastHit.x, y: lastHit.y });

        // Add the final light source generated from the last ray
        if (result.rays.length > 0) {
            result.lightSources.push(generateLightSource(firstHit, lastHit, computeIntensity(source.intensity, lastHit.distance)));
        }

        // Finalize the polygon with its second source point
        polygonPoints.push({ x: segment.l2X, y: segment.l2Y });

        // Build the lit polygon from the starting point and estimated end point
        const litPolygon: LitPolygon = {
            maxIntensity: {
                x: segment.l1X + (segment.l2X - segment.l1X) * 0.5,
                y: segment.l1Y + (segment.l2Y - segment.l1Y) * 0.5,
                value: source.intensity
            },
            minIntensity: computeMinimumIntensity(source, maxRayHit),
            points: polygonPoints
        };

        result.litPolygons.push(litPolygon);
    });

    return result;
}

function distance(x0: number, y0: number, x1: number, y1: number): number {
    return Math.sqrt(Math.pow(x1 - x0, 2) + (Math.pow(y1 - y0, 2)));
}

function closestEdge(segment: SurfaceSegment, point: Point): Point {
    const edge1Dist = distance(segment.l1X, segment.l1Y, point.x, point.y);
    const edge2Dist = distance(segment.l2X, segment.l2Y, point.x, point.y);

    if (edge1Dist < edge2Dist) {
        return { x: segment.l1X, y: segment.l1Y };
    } else {
        return { x: segment.l2X, y: segment.l2Y };
    }
}

function generateLightSource(firstHit: RayHit, lastHit: RayHit, intensity: number): LightSource {
    return {
        segment: {
            l1X: firstHit.x,
            l1Y: firstHit.y,
            l2X: lastHit.x,
            l2Y: lastHit.y
        },
        intensity: computeIntensity(intensity, firstHit.distance),
        a0: Math.atan2(firstHit.perpY, firstHit.perpX),
        a1: Math.atan2(lastHit.perpY, lastHit.perpX),
        emissionSegmentId: firstHit.segmentId
    };
}

// Test to see if the two segments are connected
function testConnection(s1: LineSegment, s2: LineSegment): Point {
    if (Math.abs(s1.l1X - s2.l1X) < MinDistance && Math.abs(s1.l1Y - s2.l1Y) < MinDistance) {
        return { x: s2.l1X, y: s2.l1Y };
    } else if (Math.abs(s1.l1X - s2.l2X) < MinDistance && Math.abs(s1.l1Y - s2.l2Y) < MinDistance) {
        return { x: s2.l2X, y: s2.l2Y };
    } else if (Math.abs(s1.l2X - s2.l1X) < MinDistance && Math.abs(s1.l2Y - s2.l1Y) < MinDistance) {
        return { x: s2.l1X, y: s2.l1Y };
    } else if (Math.abs(s1.l2X - s2.l2X) < MinDistance && Math.abs(s1.l2Y - s2.l2Y) < MinDistance) {
        return { x: s2.l2X, y: s2.l2Y };
    } else {
        return { x: -1, y: -1 };
    }
}

// Check if a target point is directly visible from a given location
function isVisible(point: Point, target: Point, surfaceSegments: SurfaceSegment[]): boolean {
    const distanceToTarget = distance(point.x, point.y, target.x, target.y);

    // Cast a ray to the target to see if its directly visible
    const testRay: Ray = {
        oX: point.x,
        oY: point.y,
        dX: (point.x - target.x) / distanceToTarget,
        dY: (point.y - target.y) / distanceToTarget,
        intensity: -1,
        emissionSegmentId: -1
    };

    const rayHit = traceRay(testRay, surfaceSegments);

    return Math.abs(rayHit.distance - distanceToTarget) > MinDistance;
}

function computeIntensity(intensity: number, distance: number) {
    if (distance <= 0) {
        return intensity;
    }

    const linearFalloff = 1.0 - (Math.min(distance, 400)) / 400;

    return intensity * linearFalloff;
}

function computeMinimumIntensity(source: LightSource, maxRayHit: RayHit): IntensityPoint {
    const sourceCenter: Point = {
        x: source.segment.l1X + (source.segment.l2X - source.segment.l1X) * 0.5,
        y: source.segment.l1Y + (source.segment.l2Y - source.segment.l1Y) * 0.5
    };

    const sourceAngle = source.a0 + (source.a1 - source.a0) * 0.5;

    return {
        x: sourceCenter.x + Math.cos(sourceAngle) * maxRayHit.distance,
        y: sourceCenter.y + Math.sin(sourceAngle) * maxRayHit.distance,
        value: computeIntensity(source.intensity, maxRayHit.distance)
    };
}

function traceRay(ray: Ray, surfaceSegments: SurfaceSegment[]): RayHit {
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
            distance: cDist,
            perpX: cPerpX,
            perpY: cPerpY,
            segmentId: cSegment
        };
    }

    return { x: -100, y: -100, distance: 0, perpX: -100, perpY: -100, segmentId: -1 };
}