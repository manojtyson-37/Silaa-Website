const fs = require('fs');
const data = JSON.parse(fs.readFileSync('styles.json', 'utf8'));

console.log("Total styles:", data.length);
let failed = false;
data.forEach((s, i) => {
  if (!s.variants) {
    console.error(`Style ${s.id} (${s.name}) is missing variants array`);
    failed = true;
  } else if (!Array.isArray(s.variants)) {
    console.error(`Style ${s.id} (${s.name}) variants is not an array:`, typeof s.variants);
    failed = true;
  }
});

if (!failed) {
  console.log("All styles have valid variants arrays.");
}
