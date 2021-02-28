import { Epsilon, Sigma } from "../Constants";
import { LightSource } from "../LightSources/LightSource";
import { LitPolygon } from "../LightSources/LitPolygon";
import { LineSegment } from "../Primitives/LineSegment";
import { Point } from "../Primitives/Point";
import { Ray } from "../Primitives/Ray";
import { Surface } from "../Environment/Surface";
import { Angle } from "../Common/Angle";
import { LightHelper } from "../Common/LightHelper";
import { SegmentHelper } from "../Common/SegmentHelper";
import { PointHelper } from "../Common/PointHelper";

interface RayHit {
    origin: Point;
    location: Point;

    castAngle: number;
    bounceAngle: number;

    distance: number;
    surfaceId: number;
}

export interface TraceResult {
    totalRays: number,
    visibleRays: LineSegment[],
    litPolygons: LitPolygon[],
    lightSources: LightSource[]
}

export function traceLights(lightSources: LightSource[], surfaces: Surface[]): TraceResult {
    let result: TraceResult = {
        totalRays: 0,
        visibleRays: [],
        litPolygons: [],
        lightSources: []
    };

    lightSources.forEach(source => {
        const sourceResult: TraceResult = traceSource(source, surfaces);

        // Add all the properties from this trace
        result.totalRays += sourceResult.totalRays;
        result.visibleRays.push(...sourceResult.visibleRays);
        result.litPolygons.push(...sourceResult.litPolygons);
        result.lightSources.push(...sourceResult.lightSources);
    });

    return result;
}

function traceSource(source: LightSource, surfaces: Surface[]): TraceResult {
    let result: TraceResult = {
        totalRays: 0,
        visibleRays: [],
        litPolygons: [],
        lightSources: []
    };

    const sourceOrigin = LightHelper.Origin(source);

    if (sourceOrigin === undefined) return result;

    const validHits: RayHit[] = [];
    const polygonPoints: Point[] = [];

    // Build rays for both source segment endpoints
    const sourceP1Ray: Ray = { origin: source.segment.p1, angle: source.p1Angle };
    const sourceP2Ray: Ray = { origin: source.segment.p2, angle: source.p2Angle };

    const sourceP1Hit: RayHit | undefined = traceRay(sourceP1Ray, surfaces, result);
    const sourceP2Hit: RayHit | undefined = traceRay(sourceP2Ray, surfaces, result);

    if (sourceP1Hit !== undefined) {
        validHits.push(sourceP1Hit);
    }

    if (sourceP2Hit !== undefined) {
        validHits.push(sourceP2Hit);
    }

    // The source has no intensity, add result rays for debugging purposes
    if (source.intensity < Epsilon) {
        for (let i = 0; i < validHits.length; i++) {
            result.visibleRays.push({ p1: validHits[i].origin, p2: validHits[i].location });
        }

        return result;
    }

    // Find all valid ray hits for the light source and environment
    for (let i = 0; i < surfaces.length; i++) {
        const surface: Surface = surfaces[i];

        // Don't test the surface if its the source emission surface
        if (surface.id === source.emissionSurfaceId) continue;

        const surfaceSegment: LineSegment = surface.segment;

        const p1Hit: RayHit | undefined = checkVisibility(surfaceSegment.p1, surface, surfaces, source, sourceOrigin, result);
        const p2Hit: RayHit | undefined = checkVisibility(surfaceSegment.p2, surface, surfaces, source, sourceOrigin, result);

        if (p1Hit !== undefined) {
            validHits.push(p1Hit);
        }

        if (p2Hit !== undefined) {
            validHits.push(p2Hit);
        }
    }

    // Sort the valid hits by emission angle and fix connections
    sortRayHits(validHits, surfaces, sourceOrigin);

    if (validHits.length > 0) {
        let sourceStart: RayHit = validHits[0];
        let previousHit: RayHit = validHits[0];

        // Start the light fill at the origin and first hit
        polygonPoints.push(previousHit.origin);
        polygonPoints.push(previousHit.location);

        // Draw the first visible ray
        result.visibleRays.push({ p1: previousHit.origin, p2: previousHit.location });

        // Go through hits by emission angle and fix congruency issues
        for (let i = 1; i < validHits.length; i++) {
            const currentHit = validHits[i];

            result.visibleRays.push({ p1: currentHit.origin, p2: currentHit.location });

            // If current hit is on the same surface as the previous hit they are directly connected
            if (currentHit.surfaceId === previousHit.surfaceId) {
                polygonPoints.push(currentHit.location);
                previousHit = currentHit;
            } else {
                // If the current hit is not directly connected to the previous hit back trace to determine the continuos hit location
                if (!PointHelper.Equal(previousHit.location, currentHit.location)) {
                    // Back trace the previous hit 
                    const previousRay: Ray = { origin: previousHit.location, angle: previousHit.castAngle };
                    const previousTrace: RayHit | undefined = traceRay(previousRay, surfaces, result);

                    // Back trace started from a new location and is a valid visible hit
                    if (previousTrace !== undefined &&
                        !alreadyTraced(previousTrace, result.visibleRays) &&
                        !collisionPerpendicular(previousTrace, surfaces)) {
                        // Add the visible ray
                        polygonPoints.push(previousTrace.location);
                        result.visibleRays.push({ p1: previousTrace.origin, p2: previousTrace.location });

                        // Adjust the hit distance to account for the true source origin
                        previousTrace.distance += previousHit.distance;

                        // Add a new light for the previous source
                        result.lightSources.push(buildLightSource(source, sourceStart, previousHit));
                        sourceStart = previousTrace;
                        previousHit = previousTrace;

                        // Check for new collisions on this ray again
                        i--;
                    } else {
                        // Back trace the current hit
                        const currentRay: Ray = { origin: currentHit.location, angle: currentHit.castAngle };
                        const currentTrace: RayHit | undefined = traceRay(currentRay, surfaces, result);

                        if (currentTrace !== undefined && !collisionPerpendicular(currentTrace, surfaces)) {
                            // Add the visible ray
                            polygonPoints.push(currentTrace.location);
                            result.visibleRays.push({ p1: currentTrace.origin, p2: currentTrace.location });

                            // Adjust the hit distance to account for the true source origin
                            currentTrace.distance += currentHit.distance;

                            // The current back trace landed on the same surface as the previous hit, connect them
                            if (currentTrace.surfaceId === previousHit.surfaceId) {
                                result.lightSources.push(buildLightSource(source, previousHit, currentTrace));

                                // New source starts at the current location
                                polygonPoints.push(currentHit.location);
                                sourceStart = currentHit;
                                previousHit = currentHit;
                            }
                        }
                    }
                } else {
                    // New light source, add the ray and build a source
                    result.visibleRays.push({ p1: currentHit.origin, p2: currentHit.location });
                    result.lightSources.push(buildLightSource(source, sourceStart, previousHit));

                    sourceStart = currentHit;
                    previousHit = currentHit;
                }
            }
        }

        // Close the polygon and last visible ray
        polygonPoints.push(previousHit.origin);
        result.visibleRays.push({ p1: previousHit.origin, p2: previousHit.location });

        // Add final light source
        result.lightSources.push(buildLightSource(source, sourceStart, previousHit));
    }

    result.litPolygons.push({
        points: polygonPoints,
        minIntensity: { location: LightHelper.MinimumIntensityPoint(source, surfaces), value: 0 },
        maxIntensity: { location: SegmentHelper.Center(source.segment), value: source.intensity }
    });

    return result;
}

function sortRayHits(rayHits: RayHit[], surfaces: Surface[], sourceOrigin: Point) {
    if (rayHits.length === 0) { return; }

    // First sort using the cast angle
    rayHits.sort((a: RayHit, b: RayHit) => { return b.castAngle - a.castAngle; });

    let previousHit: RayHit = rayHits[0];

    // Correct any out of order connected surfaces
    for (let i = 1; i < rayHits.length; i++) {
        const currentHit: RayHit = rayHits[i];

        // Two consecutive hits don't match and are connected
        if (previousHit.surfaceId !== currentHit.surfaceId && i < rayHits.length - 2) {
            // Grab the next ray hit
            const nextHit = rayHits[i + 1];

            // The two rays share the same location
            if (PointHelper.Equal(currentHit.location, nextHit.location)) {
                // If the next was on the same surface, swap them
                if (nextHit.surfaceId === previousHit.surfaceId) {
                    rayHits[i] = nextHit;
                    rayHits[i + 1] = currentHit;
                    i++;
                } else { // Otherwise swap them based on the surface locations
                    const currentCenter: Point = SegmentHelper.Center(surfaces[currentHit.surfaceId].segment);
                    const nextCenter: Point = SegmentHelper.Center(surfaces[nextHit.surfaceId].segment);

                    // Determine their center angles from the source origin
                    const currentOriginAngle = Angle.FromVector({ x: currentCenter.x - sourceOrigin.x, y: currentCenter.y - sourceOrigin.y });
                    const nextOriginAngle = Angle.FromVector({ x: nextCenter.x - sourceOrigin.x, y: nextCenter.y - sourceOrigin.y });

                    // If they are out of order swap them
                    if (nextOriginAngle > currentOriginAngle) {
                        rayHits[i] = nextHit;
                        rayHits[i + 1] = currentHit;
                        i++;
                    }
                }         
            }
        }

        previousHit = currentHit;
    }
}

function buildLightSource(source: LightSource, firstHit: RayHit, lastHit: RayHit): LightSource {
    const avgDistance = (firstHit.distance + lastHit.distance) / 2;

    return {
        segment: {
            p1: firstHit.location,
            p2: lastHit.location
        },
        intensity: LightHelper.Intensity(source, avgDistance),
        p1Angle: firstHit.bounceAngle,
        p2Angle: lastHit.bounceAngle,
        emissionSurfaceId: firstHit.surfaceId
    };
}

function alreadyTraced(hit: RayHit, visibleRays: LineSegment[]): boolean {
    for (let i=0; i < visibleRays.length; i++) {
        if (PointHelper.Equal(hit.origin, visibleRays[i].p1) &&
            PointHelper.Equal(hit.location, visibleRays[i].p2)) {
            return true;
        }
    }

    return false;
}

function checkVisibility(target: Point, targetSurface: Surface, surfaces: Surface[], source: LightSource, sourceOrigin: Point, result: TraceResult): RayHit | undefined {
    const castAngle = Angle.FromVector({ x: target.x - sourceOrigin.x, y: target.y - sourceOrigin.y });

    // The target is within the source casting range
    if (castAngle > Math.min(source.p1Angle, source.p2Angle) &&
        castAngle < Math.max(source.p1Angle, source.p2Angle)) {
        const targetNormal = Angle.FromVector(targetSurface.normal);
        const reverseCast = Angle.Reverse(castAngle);

        // target is not facing the source
        if (Angle.Perpendicular(reverseCast, targetNormal)) {
            return undefined;
        }

        const bounceRay: Ray = {
            origin: target,
            angle: reverseCast
        };

        const rayHit: RayHit | undefined = traceRay(bounceRay, surfaces, result);

        // Valid ray cast that hit the emission source (nothing blocking it)
        if (rayHit !== undefined && rayHit.surfaceId === source.emissionSurfaceId) {
            return {
                origin: rayHit.location,
                location: target,
                castAngle,
                bounceAngle: Angle.Reflect(reverseCast, targetNormal),
                distance: rayHit.distance,
                surfaceId: targetSurface.id
            };
        }
    }

    return undefined;
}

function collisionPerpendicular(hit: RayHit, surfaces: Surface[]) {
    const hitSurface = surfaces[hit.surfaceId];
    const reverseCast = Angle.Reverse(hit.castAngle);

    return Angle.Perpendicular(reverseCast, Angle.FromVector(hitSurface.normal));
}

function traceRay(ray: Ray, surfaces: Surface[], result: TraceResult): RayHit | undefined {
    // Another ray cast
    result.totalRays++;

    // Closest segment stats
    let cDist: number = Sigma;
    let cPerpX: number = -1;
    let cPerpY: number = -1;
    let cSegment: number = -1;

    const dx = Math.cos(ray.angle);
    const dy = Math.sin(ray.angle);

    // Intersection algorithm http://ahamnett.blogspot.com/2012/06/raypolygon-intersections.html
    for (let i = 0; i < surfaces.length; i++) {
        const segment: LineSegment = surfaces[i].segment;

        let segX: number = segment.p2.x - segment.p1.x;
        let segY: number = segment.p2.y - segment.p1.y;

        // Vertical optimization
        if (segX === 0) {
            let perpDot: number = dx * segY;

            let dX: number = segment.p1.x - ray.origin.x;
            let dY: number = segment.p1.y - ray.origin.y;

            let t: number = (segY * dX) / perpDot;

            // The ray is minimal length and closer than all other hits
            if (t > Epsilon && t < cDist) {
                let s: number = (dy * dX + -dx * dY) / perpDot;

                // The ray is valid on the segment
                if (s >= 0 && s <= 1) {
                    cDist = t;
                    cPerpX = -dx;
                    cPerpY = dy;
                    cSegment = surfaces[i].id;
                }
            }
        } else if (segY === 0) { // Horizontal optimization
            let perpDot: number = dy * -segX;

            let dX: number = segment.p1.x - ray.origin.x;
            let dY: number = segment.p1.y - ray.origin.y;

            let t: number = (-segX * dY) / perpDot;

            // The ray is minimal length and closer than all other hits
            if (t > Epsilon && t < cDist) {
                let s = (dy * dX + -dx * dY) / perpDot;

                // The ray is valid on the segment
                if (s >= 0 && s <= 1) {
                    cDist = t;
                    cPerpX = dx;
                    cPerpY = -dy;
                    cSegment = surfaces[i].id;
                }
            }
        } else { // Arbitrary Segment
            let segPerpX: number = segY;
            let segPerpY: number = -segX;

            let perpDot: number = dx * segPerpX + dy * segPerpY;

            // Ignore parallel lines
            if (Math.abs(perpDot) > Epsilon) {
                let dX: number = segment.p1.x - ray.origin.x;
                let dY: number = segment.p2.y - ray.origin.y;

                let t: number = (segPerpX * dX + segPerpY * dY) / perpDot;
                let s: number = (dy * dX + -dx * dY) / perpDot;

                // The ray is a valid hit
                if (t > Epsilon && s >= 0 && s <= 1) {
                    // The hit is closer than all other segments
                    if (t < cDist) {
                        cDist = t;
                        cSegment = surfaces[i].id;
                    }
                }
            }
        }
    };

    // Valid hit
    if (cDist < Sigma) {
        return {
            origin: ray.origin,
            location: {
                x: Math.max(ray.origin.x + dx * cDist, 0),
                y: Math.max(ray.origin.y + dy * cDist, 0)
            },
            castAngle: ray.angle,
            bounceAngle: Angle.Normalize(Math.atan2(cPerpY, cPerpX)),
            distance: cDist,
            surfaceId: cSegment
        };
    }

    return undefined;
}