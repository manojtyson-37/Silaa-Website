const fs = require('fs');
const { execSync } = require('child_process');

const API_BASE = 'https://silaa-website.vercel.app/api/erp';
// Get Token
const tokenCmd = `curl -s -X POST ${API_BASE}/auth/login -H 'Content-Type: application/json' -d '{"username": "admin", "password": "EVzzTRm3gnwbAqFF"}' | jq -r .access_token`;
const TOKEN = execSync(tokenCmd).toString().trim();

if (!TOKEN || TOKEN === 'null') {
    console.error("Failed to get token!");
    process.exit(1);
}

const endpoints = [
    { method: 'GET', path: '/dashboard/metrics' },
    { method: 'GET', path: '/fabric-items' },
    { method: 'GET', path: '/styles' },
    { method: 'GET', path: '/styles-with-variants' },
    { method: 'GET', path: '/sales-orders' },
    { method: 'GET', path: '/purchase-orders' },
    { method: 'GET', path: '/expenses' },
    { method: 'GET', path: '/users' }
];

async function run() {
    let allPassed = true;
    for (const ep of endpoints) {
        try {
            console.log(`Testing [${ep.method}] ${ep.path}...`);
            const res = await fetch(`${API_BASE}${ep.path}`, {
                method: ep.method,
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const text = await res.text();
            if (res.ok) {
                console.log(`✅ [${ep.method}] ${ep.path} - ${res.status} OK (Response size: ${text.length} bytes)`);
            } else {
                console.log(`❌ [${ep.method}] ${ep.path} - ${res.status} ERROR`);
                console.log(`   Response: ${text.slice(0, 200)}`);
                allPassed = false;
            }
        } catch (e) {
            console.log(`❌ [${ep.method}] ${ep.path} - NETWORK ERROR: ${e.message}`);
            allPassed = false;
        }
    }
    if (allPassed) {
        console.log("\n🎉 ALL ENDPOINTS WORKING PERFECTLY!");
    } else {
        console.log("\n⚠️ SOME ENDPOINTS FAILED.");
    }
}

run();
