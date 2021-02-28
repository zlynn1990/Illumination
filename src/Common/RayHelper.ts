import { Ray } from "../Primitives/Ray";
import { Epsilon } from "../Constants";
import { Point } from "../Primitives/Point";

export class RayHelper {
    static Intersection(r1: Ray, r2: Ray): Point | undefined {
        // Direct connection and intersection
        if (r1.origin.x === r2.origin.x &&
            r1.origin.y === r2.origin.y) {
            return r1.origin;
        }
    
        const r1Direction: Point = {
            x: Math.cos(r1.angle),
            y: Math.sin(r1.angle)
        };
    
        const r2Direction: Point = {
            x: Math.cos(r2.angle),
            y: Math.sin(r2.angle)
        };
    
        const deltaAngle = (r2Direction.x * r1Direction.y) - (r2Direction.y * r1Direction.x);
    
        // Confirm lines aren't parallel
        if (Math.abs(deltaAngle) > Epsilon) {
            const dx = r2.origin.x - r1.origin.x;
            const dy = r2.origin.y - r1.origin.y;
    
            const u = (dy * r2Direction.x - dx * r2Direction.y) / deltaAngle;
            const v = (dy * r1Direction.x - dx * r1Direction.y) / deltaAngle;
    
            // Intersection
            if (u >= 0 && v >= 0) {
                return {
                    x: r1.origin.x + r1Direction.x * u,
                    y: r1.origin.y + r1Direction.y * u
                };
            }
        }
    
        return undefined;
    }
}