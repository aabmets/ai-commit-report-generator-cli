import fs from 'fs/promises'
export async function readFileOrCreate(path:string){

        let fileContent:string|null = null;
        try{
          fileContent = await fs.readFile(path,"utf-8")
        }catch(err){
            console.error("Failed to read the cache file",err)
            try{
                await fs.writeFile(path,JSON.stringify({}))
            }catch(err){
                console.error("Failed to create the cache file",err)

            }

        }


        return fileContent

}