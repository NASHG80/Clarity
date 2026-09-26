import fs from 'fs';
import path from 'path';

let content = fs.readFileSync('temp_translations.js', 'utf8');

// Strip out "as DataStateType"
content = content.replace(/as\s+DataStateType/g, '');

// Convert to json-like by using Function constructor
const extractDict = new Function(content + '; return translations;');
const translations = extractDict();

for (const lang of ['en', 'hi', 'mr']) {
    const filePath = `src/i18n/${lang}/b2c.json`;
    const dict = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Add home namespace
    dict['home'] = translations[lang];
    fs.writeFileSync(filePath, JSON.stringify(dict, null, 2), 'utf8');
}
console.log('Merged translations!');
