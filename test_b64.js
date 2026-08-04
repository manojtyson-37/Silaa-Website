const b64 = "eyJzdWIiOiAiYWRtaW4iLCAicm9sZSI6ICJhZG1pbiIsICJleHAiOiAxNjg1NDczMzI2fQ"; // standard urlsafe without padding (dummy)
const buf1 = Buffer.from(b64, "base64");
console.log("base64:", buf1.toString());
const buf2 = Buffer.from(b64, "base64url");
console.log("base64url:", buf2.toString());
