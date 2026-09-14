const fs = require('fs');
const nav = fs.readFileSync('src/navigation/index.tsx','utf8');
const app = fs.readFileSync('App.tsx','utf8');
const ctx = fs.readFileSync('src/contexts/FeatureFlagsContext.tsx','utf8');

console.log('1. FeatureFlagsProvider in App.tsx:', app.includes('FeatureFlagsProvider'));
console.log('2. Provider wraps children:', app.includes('<FeatureFlagsProvider>'));
console.log('3. useFeatureFlags imported in nav:', nav.includes('useFeatureFlags'));
console.log('4. isEnabled in tabs:', nav.includes("isEnabled('community')"));
console.log('5. Conditional Tab.Screen:', nav.includes('{isEnabled'));

// Check if React Nav supports dynamic tabs
// The issue: Tab.Navigator re-renders but screens don't add/remove dynamically
// We need a KEY prop that forces re-mount when flags change
console.log('6. Key on Tab.Navigator:', nav.includes('key={'));
console.log('7. Flags used as key:', nav.includes('flags'));
