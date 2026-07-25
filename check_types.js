const fs = require('fs');
const data = JSON.parse(fs.readFileSync('styles.json', 'utf8'));

let hasObj = false;
data.forEach(s => {
  for (const key in s) {
    if (key !== 'variants' && s[key] !== null && typeof s[key] === 'object') {
      console.error(`Style ${s.id} has object in ${key}:`, s[key]);
      hasObj = true;
    }
  }
  s.variants.forEach(v => {
    for (const key in v) {
      if (v[key] !== null && typeof v[key] === 'object') {
        console.error(`Variant ${v.id} has object in ${key}:`, v[key]);
        hasObj = true;
      }
    }
  });
});
if(!hasObj) console.log("All fields are primitives.");
