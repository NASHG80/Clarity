import fs from 'fs';

const text = fs.readFileSync('src/shared/homepage.tsx', 'utf-8');

const startStr = 'export const translations = {';
const startIdx = text.indexOf(startStr);
const endStr = 'export default function Homepage';
const endIdx = text.indexOf(endStr);

let transStr = text.substring(startIdx, endIdx);

// Remove 'export const '
transStr = transStr.replace('export const translations = ', 'const translations = ');

fs.writeFileSync('temp_translations.js', transStr + '\nexport { translations };');
