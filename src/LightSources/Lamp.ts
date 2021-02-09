import { Light } from "./Light";
import { LightSource } from "./LightSource";

export class Lamp implements Light {

    private sources: LightSource[];

    constructor(source: LightSource) {
        this.sources = [ source ];
    }

    generateSources(): LightSource[] {
        return this.sources;
    }
}