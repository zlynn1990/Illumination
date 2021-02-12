import { CanvasHeight, CanvasWidth } from "../Constants";
import { Light } from "./Light";
import { LightSource } from "./LightSource";

export class CursorLight implements Light {
    private sourceX = CanvasWidth / 2;
    private sourceY = CanvasHeight / 4;

    private angle;

    constructor(angle: number) {
        this.angle = angle;
    }

    Update(cursorX: number, cursorY: number): void {
        this.sourceX = cursorX;
        this.sourceY = cursorY;
    }

    generateSources(): LightSource[] {
        this.angle += 0.01;
        
        return [{
            segment: { l1X: this.sourceX, l1Y: this.sourceY, l2X: this.sourceX, l2Y: this.sourceY },
            a0: this.angle,
            a1: this.angle + 1,
            intensity: 0.65,
            emissionSegmentId: -1
          }];
    }
}