import { LightSource } from "./LightSource";

export interface Light {
    generateSources(): LightSource[];
}