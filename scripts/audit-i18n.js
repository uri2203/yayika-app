const fs = require('fs');
const content = fs.readFileSync('src/config/i18n.ts', 'utf8');

const neededKeys = [
  'challenges_title', 'challenges_subtitle', 'challenges_progress_label',
  'challenges_progress', 'challenges_active', 'challenges_available',
  'challenges_completed', 'challenges_empty', 'challenges_checkin_error',
  'nav_retos',
];

const languages = ['es', 'en', 'pt', 'fr', 'de'];

for (const lang of languages) {
  const langStart = content.indexOf(lang + ': {');
  if (langStart < 0) { console.log(lang + ': SECTION NOT FOUND'); continue; }
  
  let langEnd = content.length;
  for (const otherLang of languages) {
    if (otherLang === lang) continue;
    const otherStart = content.indexOf(otherLang + ': {', langStart + 10);
    if (otherStart > 0 && otherStart < langEnd) langEnd = otherStart;
  }
  
  const section = content.substring(langStart, langEnd);
  const missing = [];
  
  for (const key of neededKeys) {
    if (!section.includes(key + ':')) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    console.log(lang + ': MISSING ' + missing.length + ' keys: ' + missing.join(', '));
  } else {
    console.log(lang + ': ALL ' + neededKeys.length + ' KEYS PRESENT');
  }
}
