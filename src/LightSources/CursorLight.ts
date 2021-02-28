import { Light } from "./Light";
import { Surface } from "../Environment/Surface";
import { Point } from "../Primitives/Point";
import { LightSource } from "./LightSource";
import { LineSegment } from "../Primitives/LineSegment";

export class CursorLight implements Light {
    private center: Point = { x: 390, y: 250 };
    
    private leftSurface: Surface;
    private topSurface: Surface;
    private rightSurface: Surface;
    private bottomSurface: Surface;

    private width: number;
    private height: number;

    constructor(width: number, height: number, surfaces: Surface[]) {
        this.width = width;
        this.height = height;

        this.leftSurface = {
            id: surfaces.length,
            normal: { x: -1, y: 0 },
            segment: this.buildLeftSegment()
        }

        surfaces.push(this.leftSurface);

        this.topSurface = {
            id: surfaces.length,
            normal: { x: 0, y: -1 },
            segment: this.buildTopSegment()
        }

        surfaces.push(this.topSurface);

        this.rightSurface = {
            id: surfaces.length,
            normal: { x: 1, y: 0 },
            segment: this.buildRightSegment()
        }

        surfaces.push(this.rightSurface);

        this.bottomSurface = {
            id: surfaces.length,
            normal: { x: 0, y: 1 },
            segment: this.buildBottomSegment()
        }

        surfaces.push(this.bottomSurface);
    }

    update(position: Point) {
        this.center = position;

        this.leftSurface.segment = this.buildLeftSegment();
        this.topSurface.segment = this.buildTopSegment();
        this.rightSurface.segment = this.buildRightSegment();
        this.bottomSurface.segment = this.buildBottomSegment();
    }

    buildLeftSegment(): LineSegment {
        return {
            p1: { x: this.center.x - this.width * 0.5, y: this.center.y - this.height * 0.5 },
            p2: { x: this.center.x - this.width * 0.5, y: this.center.y + this.height * 0.5 }
        };
    }

    buildTopSegment(): LineSegment {
        return {
            p1: { x: this.center.x - this.width * 0.5, y: this.center.y - this.height * 0.5 },
            p2: { x: this.center.x + this.width * 0.5, y: this.center.y - this.height * 0.5 }
        };
    }

    buildRightSegment(): LineSegment {
        return {
            p1: { x: this.center.x + this.width * 0.5, y: this.center.y - this.height * 0.5 },
            p2: { x: this.center.x + this.width * 0.5, y: this.center.y + this.height * 0.5 }
        };
    }

    buildBottomSegment(): LineSegment {
        return {
            p1: { x: this.center.x - this.width * 0.5, y: this.center.y + this.height * 0.5 },
            p2: { x: this.center.x + this.width * 0.5, y: this.center.y + this.height * 0.5 }
        };
    }

    generateSources(): LightSource[] {
        return [{
            segment: this.leftSurface.segment,
            p1Angle: 3.5,
            p2Angle: 2.75,
            intensity: 1,
            emissionSurfaceId: this.leftSurface.id
        }];
    }
}