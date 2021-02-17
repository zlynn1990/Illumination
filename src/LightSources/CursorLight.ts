import { CanvasHeight, CanvasWidth } from "../Constants";
import { Light } from "./Light";
import { LightSource } from "./LightSource";

export class CursorLight implements Light {
    private sourceX = CanvasWidth / 8;
    private sourceY = CanvasHeight - 100;

    private angle;

    constructor(angle: number) {
        this.angle = angle;
    }

    updatePosition(cursorX: number, cursorY: number): void {
        this.sourceX = cursorX;
        this.sourceY = cursorY;
    }

    rotate(deltaTime: number) {
        this.angle += deltaTime * 0.0001;
    }

    generateSources(): LightSource[] {       
        return [{
            segment: { l1X: this.sourceX, l1Y: this.sourceY, l2X: this.sourceX, l2Y: this.sourceY },
            minAngle: this.angle,
            maxAngle: this.angle + 0.5,
            intensity: 0.65,
            emissionSegmentId: -1
          }];
    }
}