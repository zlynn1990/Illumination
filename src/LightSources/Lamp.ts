import { Surface } from "../Environment/Surface";
import { Light } from "./Light";
import { LightSource } from "./LightSource";

export class Lamp implements Light {

    private sources: LightSource[];

    constructor(surface: Surface, p1Angle: number, p2Angle: number, intensity: number) {
        this.sources = [{
            p1Angle,
            p2Angle,
            intensity,
            segment: surface.segment,
            emissionSurfaceId: surface.id,
        }];
    }

    generateSources(): LightSource[] {
        return this.sources;
    }
}