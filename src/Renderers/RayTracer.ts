import { Epsilon, RaysPerAngle } from "../Constants";
import { LightSource } from "../LightSources/LightSource";
import { IntensityPoint, LitPolygon } from "../LightSources/LitPolygon";
import { closestEdge, LineSegment, testConnection } from "../Primitives/LineSegment";
import { distance, Point } from "../Primitives/Point";
import { Ray } from "../Primitives/Ray";
import { Surface } from "../Environment/Surface";

interface RayHit {
    emmisionRay: Ray;

    location: Point;
    bounceAngle: number;

    distance: number;
    surfaceId: number;
}

export interface TraceResult {
    rays: LineSegment[],
    litPolygons: LitPolygon[],
    lightSources: LightSource[]
}

export function traceLights(lightSources: LightSource[], surfaces: Surface[]): TraceResult {
    let result: TraceResult = {
        rays: [],
        litPolygons: [],
        lightSources: []
    };

    lightSources.forEach(source => {
        // Skip sources without any intensity (hits that were far away)
        if (source.intensity < Epsilon) {
            return;
        }

        const sourceResult: TraceResult = traceSource(source, surfaces);

        // Add all the properties from this trace
        result.rays.push(...sourceResult.rays);
        result.litPolygons.push(...sourceResult.litPolygons);
        result.lightSources.push(...sourceResult.lightSources);
    });

    return result;
}

function emptyHit(): RayHit {
    return {
        emmisionRay: {
            origin: { x: 0, y: 0 },
            angle: 0,
            intensity: 0,
            emissionSurfaceId: -1
        },
        location: { x: 0, y: 0 },
        bounceAngle: 0,
        distance: 0,
        surfaceId: -1
    }
}

function traceSource(source: LightSource, surfaces: Surface[]): TraceResult {
    let result: TraceResult = {
        rays: [],
        litPolygons: [],
        lightSources: []
    };

    const segment: LineSegment = source.segment;

    // All the points that fill form this lit polygon
    const polygonPoints: Point[] = [];

    // Add the starting origin
    polygonPoints.push({ x: segment.l1X, y: segment.l1Y });

    // Max spread of the light source between its angles
    let lightSpread = source.maxAngle - source.minAngle;

    // Normalize the angle in case its above PI
    if (lightSpread > Math.PI) {
        lightSpread -= Math.PI * 2;
    }

    const rayCount = Math.round(Math.max(Math.abs(lightSpread) * RaysPerAngle, RaysPerAngle * 0.5));

    // Position increments for each ray origin along the segment
    const incX: number = (segment.l2X - segment.l1X) / rayCount;
    const incY: number = (segment.l2Y - segment.l1Y) / rayCount;

    // Angle increments for each ray direction along the segment
    const angleInc = lightSpread / rayCount;

    // The first and last hits for any new segment
    let firstHit: RayHit = emptyHit();
    let lastHit: RayHit = emptyHit();

    // Segment intensities at each hit so that the average can be computed for the new light source intensity
    let sgementIntensities: number[] = [];

    // Draw n rays from the source light
    for (let i = 0; i < rayCount; i++) {
        const ray: Ray = {
            origin: {
                x: segment.l1X + incX * i,
                y: segment.l1Y + incY * i
            },
            angle: source.minAngle + angleInc * i,
            intensity: source.intensity,
            emissionSurfaceId: source.emissionSegmentId
        };

        const rayHit: RayHit = traceRay(ray, surfaces);

        // Invalid hit, continue
        if (rayHit.surfaceId < 0) {
            continue;
        }

        // Register the ray hit and keep track of the intensity
        result.rays.push({ l1X: ray.origin.x, l1Y: ray.origin.y, l2X: rayHit.location.x, l2Y: rayHit.location.y });
        sgementIntensities.push(computeIntensity(source.intensity, rayHit.distance));

        // First valid hit
        if (firstHit.surfaceId === -1) {
            firstHit = { ...rayHit };
            lastHit = { ...rayHit };

            polygonPoints.push(rayHit.location);
        }
        // The ray has hit a different surface
        else if (rayHit.surfaceId !== lastHit.surfaceId) {
            const lastSurface: Surface = surfaces[lastHit.surfaceId];
            const currentSurface: Surface = surfaces[rayHit.surfaceId];

            const connection: Point = testConnection(lastSurface.segment, currentSurface.segment);

            // If there is a direct connection ensure the lighting is continous
            if (connection.x >= 0) {
                polygonPoints.push(connection);

                // Build the connection point as a ray hit
                const sharedHit: RayHit = {
                    emmisionRay: ray,
                    location: connection,
                    bounceAngle: rayHit.bounceAngle,
                    surfaceId: rayHit.surfaceId,
                    distance: distance(connection.x, connection.y, ray.origin.x, ray.origin.y),
                };

                // Create a new light source from the first hit to the shared point
                result.lightSources.push(generateLightSource(firstHit, sharedHit, getAverageIntensity(sgementIntensities)));

                // Update the first hit to this shared point and reset segment intensities
                firstHit = { ...sharedHit };
                sgementIntensities = [];
            } else { // Otherwise binary search until all edges are continous
                const currentRay: Ray = rayHit.emmisionRay;
                const lastRay: Ray = lastHit.emmisionRay;

                const middleRay: Ray = {
                    origin: {
                        x: currentRay.origin.x + (lastRay.origin.x - currentRay.origin.x) * 0.5,
                        y: currentRay.origin.y + (lastRay.origin.y - currentRay.origin.y) * 0.5
                    },
                    angle: rayHit.emmisionRay.angle + (lastRay.angle - currentRay.angle) * 0.5,
                    intensity: ray.intensity,
                    emissionSurfaceId: ray.emissionSurfaceId
                };

                const binaryHit: RayHit = traceRay(middleRay, surfaces);

                result.rays.push({ l1X: middleRay.origin.x, l1Y: middleRay.origin.y, l2X: binaryHit.location.x, l2Y: binaryHit.location.y });

                if (binaryHit.surfaceId === lastHit.surfaceId) {
                    
                }

                // // Close the previous segment
                // const closestLastSegmentEdge: Point = closestEdge(lastSurface.segment, { x: rayHit.x, y: rayHit.y });

                // // If the hit is further than the edge, check if the edge is visible to the source
                // if (rayHit.distance > distance(closestLastSegmentEdge.x, closestLastSegmentEdge.y, rayOrigin.x, rayOrigin.y)) {
                //     if (isVisible(closestLastSegmentEdge, rayOrigin, surfaces)) {
                //         polygonPoints.push(closestLastSegmentEdge);

                //         // Update the last hit to this point
                //         lastHit.x = closestLastSegmentEdge.x;
                //         lastHit.y = closestLastSegmentEdge.y;
                //     }
                // } else { // Otherwise check if the closest edge on the new surface is visible to the source
                //     const closestCurrentEdgeSegement = closestEdge(currentSurface.segment, { x: rayHit.x, y: rayHit.y });

                //     if (isVisible(closestCurrentEdgeSegement, rayOrigin, surfaces)) {
                //         polygonPoints.push({ x: lastHit.x, y: lastHit.y });
                //         polygonPoints.push(closestCurrentEdgeSegement);

                //         // Update the current ray hit to this location
                //         rayHit.x = closestCurrentEdgeSegement.x;
                //         rayHit.y = closestCurrentEdgeSegement.y;
                //     } else {
                //         polygonPoints.push({ x: lastHit.x, y: lastHit.y });
                //     }
                // }

                polygonPoints.push(rayHit.location);
            }
        }

        lastHit = { ...rayHit };
    }

    // Add the last hit to the polygon
    polygonPoints.push(lastHit.location);

    // Add the final light source generated from the last ray
    if (result.rays.length > 0) {
        result.lightSources.push(generateLightSource(firstHit, lastHit, getAverageIntensity(sgementIntensities)));
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
        minIntensity: computeMinimumIntensity(source),
        points: polygonPoints
    };

    result.litPolygons.push(litPolygon);

    return result;
}

function generateLightSource(firstHit: RayHit, lastHit: RayHit, intensity: number): LightSource {
    return {
        segment: {
            l1X: firstHit.location.x,
            l1Y: firstHit.location.y,
            l2X: lastHit.location.x,
            l2Y: lastHit.location.y
        },
        intensity: computeIntensity(intensity, firstHit.distance),
        minAngle: firstHit.bounceAngle,
        maxAngle: lastHit.bounceAngle,
        emissionSegmentId: firstHit.surfaceId
    };
}

// Check if a target point is directly visible from a given location
function isVisible(point: Point, target: Point, surfaces: Surface[]): boolean {
    const distanceToTarget = distance(point.x, point.y, target.x, target.y);

    // Cast a ray to the target to see if its directly visible
    const testRay: Ray = {
        origin: point,
        angle: Math.atan2((point.y - target.y) / distanceToTarget, (point.x - target.x) / distanceToTarget),
        intensity: -1,
        emissionSurfaceId: -1
    };

    const rayHit = traceRay(testRay, surfaces);

    return Math.abs(rayHit.distance - distanceToTarget) < Epsilon;
}

function computeIntensity(intensity: number, distance: number) {
    if (distance <= 0) {
        return intensity;
    }

    const linearFalloff = 1.0 - (Math.min(distance, 650)) / 650;

    return intensity * linearFalloff;
}

function getAverageIntensity(intensities: number[]): number {
    let sum = 0;

    for (let i = 0; i < intensities.length; i++) {
        sum += intensities[i];
    }

    return sum / Math.max(intensities.length, 1);
}

function computeMinimumIntensity(source: LightSource): IntensityPoint {
    const sourceCenter: Point = {
        x: source.segment.l1X + (source.segment.l2X - source.segment.l1X) * 0.5,
        y: source.segment.l1Y + (source.segment.l2Y - source.segment.l1Y) * 0.5
    };

    const sourceAngle = source.minAngle + (source.maxAngle - source.minAngle) * 0.5;

    return {
        x: sourceCenter.x + Math.cos(sourceAngle) * 650,
        y: sourceCenter.y + Math.sin(sourceAngle) * 650,
        value: computeIntensity(source.intensity, 650)
    };
}

function traceRay(ray: Ray, surfaces: Surface[]): RayHit {
    // Closest segment stats
    let cDist: number = 100000000;
    let cPerpX: number = -1;
    let cPerpY: number = -1;
    let cSegment: number = -1;

    const dx = Math.cos(ray.angle);
    const dy = Math.sin(ray.angle);

    let visibleSurfacIds: number[] = [];

    // The ray was emitted from a surface
    if (ray.emissionSurfaceId >= 0) {
        visibleSurfacIds.push(...surfaces[ray.emissionSurfaceId].visibleSurfaceIds);
    } else { // Otherwise assume all surfaces are visible
        for (let i = 0; i < surfaces.length; i++) {
            visibleSurfacIds.push(i);
        }
    }

    // Intersection algorithm http://ahamnett.blogspot.com/2012/06/raypolygon-intersections.html
    for (let i = 0; i < visibleSurfacIds.length; i++) {
        let segment: LineSegment = surfaces[visibleSurfacIds[i]].segment;

        let segX: number = segment.l2X - segment.l1X;
        let segY: number = segment.l2Y - segment.l1Y;

        // Vertical optmization
        if (segX === 0) {
            let perpDot: number = dx * segY;

            let dX: number = segment.l1X - ray.origin.x;
            let dY: number = segment.l1Y - ray.origin.y;

            let t: number = (segY * dX) / perpDot;

            // The ray is minimal length and closer than all other hits
            if (t > Epsilon && t < cDist) {
                let s: number = (dy * dX + -dx * dY) / perpDot;

                // The ray is valid on the segment
                if (s >= 0 && s <= 1) {
                    cDist = t;
                    cPerpX = -dx;
                    cPerpY = dy;
                    cSegment = visibleSurfacIds[i];
                }
            }
        } else if (segY === 0) { // Horizontal optimziation
            let perpDot: number = dy * -segX;

            let dX: number = segment.l1X - ray.origin.x;
            let dY: number = segment.l1Y - ray.origin.y;

            let t: number = (-segX * dY) / perpDot;

            // The ray is minimal length and closer than all other hits
            if (t > Epsilon && t < cDist) {
                let s = (dy * dX + -dx * dY) / perpDot;

                // The ray is valid on the segment
                if (s >= 0 && s <= 1) {
                    cDist = t;
                    cPerpX = dx;
                    cPerpY = -dy;
                    cSegment = visibleSurfacIds[i];
                }
            }
        } else { // Arbitrary Segment
            let segPerpX: number = segY;
            let segPerpY: number = -segX;

            let perpDot: number = dx * segPerpX + dy * segPerpY;

            // Ignore parallel lines
            if (Math.abs(perpDot) > Epsilon) {
                let dX: number = segment.l1X - ray.origin.x;
                let dY: number = segment.l1Y - ray.origin.y;

                let t: number = (segPerpX * dX + segPerpY * dY) / perpDot;
                let s: number = (dy * dX + -dx * dY) / perpDot;

                // The ray is a valid hit
                if (t > Epsilon && s >= 0 && s <= 1) {
                    // The hit is closer than all other segments
                    if (t < cDist) {
                        cDist = t;
                        cSegment = visibleSurfacIds[i];
                    }
                }
            }
        }
    };

    // Valid hit
    if (cDist < 100000000) {
        return {
            emmisionRay: ray,
            location: {
                x: Math.max(ray.origin.x + dx * cDist, 0),
                y: Math.max(ray.origin.y + dy * cDist, 0)
            },
            bounceAngle: Math.atan2(cPerpY, cPerpX),
            distance: cDist,
            surfaceId: cSegment
        };
    }

    return emptyHit();
}