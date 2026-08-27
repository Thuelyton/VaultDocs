// preload.ts - Loaded before the main application to set up env vars
// This file is executed first via tsx --require to ensure dotenv.config()
// runs BEFORE any ES module imports hoist and read process.env
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
