import fs from 'fs';

const additions = {
  en: {
    "accessibility.closeDialog": "Close dialog",
    "accessibility.home": "Green & Inclusive Travel Homepage",
    "accessibility.languageSelector": "Language selector",
    "accessibility.toggleMenu": "Toggle menu",
    "accessibility.increase": "Increase",
    "accessibility.decrease": "Decrease",
    "accessibility.remove": "Remove"
  },
  hi: {
    "accessibility.closeDialog": "डायलॉग बंद करें",
    "accessibility.home": "ग्रीन एंड इन्क्लूसिव ट्रैवल होमपेज",
    "accessibility.languageSelector": "भाषा चयनकर्ता",
    "accessibility.toggleMenu": "मेनू टॉगल करें",
    "accessibility.increase": "बढ़ाएं",
    "accessibility.decrease": "घटाएं",
    "accessibility.remove": "हटाएं"
  },
  mr: {
    "accessibility.closeDialog": "संवाद बंद करा",
    "accessibility.home": "ग्रीन अँड इन्क्लुसिव्ह ट्रॅव्हल होमपेज",
    "accessibility.languageSelector": "भाषा निवडकर्ता",
    "accessibility.toggleMenu": "मेनू टॉगल करा",
    "accessibility.increase": "वाढवा",
    "accessibility.decrease": "कमी करा",
    "accessibility.remove": "काढून टाका"
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
console.log('Added accessibility keys');
