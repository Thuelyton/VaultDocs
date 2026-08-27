// preload.cjs - CommonJS preload script loaded before any ES modules
// Ensures process.env is populated from .env before r2.ts and other modules read it
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
