#!/usr/bin/env node

import { MenuService } from './services/menu.service';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const menuService = new MenuService();
    await menuService.start();
}

main().catch(console.error);
