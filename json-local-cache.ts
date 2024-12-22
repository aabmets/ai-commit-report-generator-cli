import fs from 'fs/promises';
import { readFileOrCreate } from './utils';
type Config = {
    path: string;
};

export class JsonStore{
    public cache:Record<string,Object> = {}
    private path:string = "./cache.json";



    public constructor(
         config:Config
    ){
        this.path = config.path

    }
    private desirializeCache(fileContent:string){

            this.cache = JSON.parse(fileContent)
            Object.entries(this.cache).forEach(([key,value])=>{
                console.log(key,value)
                if(typeof value !== "string"){
                    this.cache[key] = value
                }

                this.cache[key] = JSON.parse(value as string)
            })

    }
    public async initCache(){
        const fileContent = await readFileOrCreate(this.path)
        if (fileContent) {
            this.desirializeCache(fileContent)
            
        };

    }
    public  get(key:string){
        return this.cache[key]

    }
    public set(key:string,value:Object){
        this.cache[key] = value;
        fs.writeFile(this.path,JSON.stringify(this.cache)).then(()=>{
            console.info(`Cache[id="${this.path}"] updated for key ${key}`)

        })
    }
}