import path from "node:path";
import fs from "node:fs/promises";
export async function readFileOrCreate(rawPath: string) {
    let fileContent: string | null = null;
    const fullPath = path.join(process.cwd(), rawPath);
    try {
        fileContent = await fs.readFile(fullPath, "utf-8");
    } catch (err) {
        console.error("Failed to read the cache file", err);
        try {
            await fs.writeFile(fullPath, JSON.stringify({}));
        } catch (err) {
            console.error("Failed to create the cache file", err);
        }
    }

    return fileContent;
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
