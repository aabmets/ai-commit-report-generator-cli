import fs from "node:fs/promises";
import { readFileOrCreate } from "./utils";
type Config = {
    path: string;
};

export class JsonStore {
    public cache: Record<string, Object> = {};
    private path = "./cache.json";

    public constructor(config: Config) {
        this.path = config.path;
    }
    private desirializeCache(fileContent: string) {
        this.cache = JSON.parse(fileContent);
        Object.entries(this.cache).forEach(([key, value]) => {
            if (typeof value !== "string") {
                this.cache[key] = value;
                return;
            }

            this.cache[key] = JSON.parse(value as string);
        });
    }
    public async initCache() {
        const fileContent = await readFileOrCreate(this.path);
        if (fileContent) {
            this.desirializeCache(fileContent);
        }
    }
    public get(key: string) {
        return this.cache[key];
    }
    public getKeys(key: string) {
        return Object.keys(this.cache).filter((key) => {
            return key.startsWith(key);
        });
    }
    public getAll(keyFilter: string) {
        return Object.entries(this.cache).filter(([key, value]) => {
            return key.startsWith(keyFilter);
        });
    }
    public set(key: string, value: Object) {
        this.cache[key] = value;
        fs.writeFile(this.path, JSON.stringify(this.cache)).then(() => {
            console.info(`Cache[id="${this.path}"] updated for key ${key}`);
        });
    }
}
