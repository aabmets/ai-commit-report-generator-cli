import fs from 'fs/promises';
import { readFileOrCreate } from './utils';
export class JsonLocalCache{


    private static instance:JsonLocalCache;
    private static path = "./cache.json"

    private constructor(
    private  cache:Record<string,Object>
    ){


    }
    public  get(key:string){
        return this.cache[key]
    }
    public set(key:string,value:Object){
        this.cache[key] = value
    }
    public static async getInstance(){

        if(this.instance) return this.instance
        const fileContent = await readFileOrCreate(this.path )
        if(fileContent){
            this.instance = new JsonLocalCache(JSON.parse(fileContent))
            return this.instance
        };


        let cache:Record<string,Object>={}; 
        this.instance = new JsonLocalCache(cache)

        return this.instance

    }

}