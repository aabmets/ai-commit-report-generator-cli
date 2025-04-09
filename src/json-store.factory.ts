import fs from "node:fs";
import { JsonStore } from "./json-local-cache";

export class JsonStoreFactory {
    private instances: Record<string, JsonStore> = {};

    private constructor() {}
    static instance: JsonStoreFactory;
    static getInstance() {
        if (!JsonStoreFactory.instance) {
            JsonStoreFactory.instance = new JsonStoreFactory();
        }
        return JsonStoreFactory.instance;
    }

    async createOrGetStore(uniqueName: string) {
        if (this.instances[uniqueName]) {
            console.error(`Store already exists for this path ${uniqueName}`);
            return this.instances[uniqueName];
        }
        const cachePath = `./${uniqueName}-cache.json`;
        if (!fs.existsSync(cachePath)) {
            fs.writeFileSync(cachePath, JSON.stringify({}));
        }
        const cacheStore = new JsonStore({
            path: `./${uniqueName}-cache.json`,
        });
        await cacheStore.initCache();

        this.instances[uniqueName] = cacheStore;

        return this.instances[uniqueName];
    }
}
