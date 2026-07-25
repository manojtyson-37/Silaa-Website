import { createClient } from "next-sanity";
const client = createClient({
  projectId: "nmf3ae7w",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false
});
async function run() {
  const campaigns = await client.fetch(`*[_type == "campaign" && isActive == true]`);
  console.log(JSON.stringify(campaigns, null, 2));
}
run();
