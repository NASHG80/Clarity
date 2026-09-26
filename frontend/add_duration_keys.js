import fs from 'fs';

const additions = {
  en: {
    "duration.days_one": "{{count}} day",
    "duration.days_other": "{{count}} days",
    "duration.nights_one": "{{count}} night",
    "duration.nights_other": "{{count}} nights",
    "duration.hours_one": "{{count}} hr",
    "duration.hours_other": "{{count}} hrs",
    "duration.minutes_one": "{{count}} min",
    "duration.minutes_other": "{{count}} mins"
  },
  hi: {
    "duration.days_one": "{{count}} दिन",
    "duration.days_other": "{{count}} दिन",
    "duration.nights_one": "{{count}} रात",
    "duration.nights_other": "{{count}} रातें",
    "duration.hours_one": "{{count}} घंटा",
    "duration.hours_other": "{{count}} घंटे",
    "duration.minutes_one": "{{count}} मिनट",
    "duration.minutes_other": "{{count}} मिनट"
  },
  mr: {
    "duration.days_one": "{{count}} दिवस",
    "duration.days_other": "{{count}} दिवस",
    "duration.nights_one": "{{count}} रात्र",
    "duration.nights_other": "{{count}} रात्री",
    "duration.hours_one": "{{count}} तास",
    "duration.hours_other": "{{count}} तास",
    "duration.minutes_one": "{{count}} मिनिट",
    "duration.minutes_other": "{{count}} मिनिटे"
  }
};

for (const lang of ['en', 'hi', 'mr']) {
  const path = `src/i18n/${lang}/b2c.json`;
  const dict = JSON.parse(fs.readFileSync(path, 'utf8'));
  
  for (const [key, value] of Object.entries(additions[lang])) {
    dict[key] = value;
  }
  
  fs.writeFileSync(path, JSON.stringify(dict, null, 2), 'utf8');
}
console.log('Added duration keys');
