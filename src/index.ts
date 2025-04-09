#!/usr/bin/env node

import dotenv from "dotenv";
import { MenuService } from "./services/menu.service";

dotenv.config();

async function main() {
    const menuService = new MenuService();
    await menuService.start();
}

main().catch(console.error);
