const fs = require('fs');
const data = JSON.parse(fs.readFileSync('styles.json', 'utf8'));

const styleIds = new Set();
const variantIds = new Set();
let hasDupes = false;

data.forEach(s => {
  if (!s.id) { console.error("Style missing ID", s); hasDupes = true; }
  if (styleIds.has(s.id)) { console.error("Duplicate Style ID", s.id); hasDupes = true; }
  styleIds.add(s.id);
  
  s.variants.forEach(v => {
    if (!v.id) { console.error("Variant missing ID", v); hasDupes = true; }
    if (variantIds.has(v.id)) { console.error("Duplicate Variant ID", v.id); hasDupes = true; }
    variantIds.add(v.id);
  });
});

if (!hasDupes) console.log("No duplicate or null IDs.");
