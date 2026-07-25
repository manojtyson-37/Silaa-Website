import { createClient } from "next-sanity";
const client = createClient({
  projectId: "nmf3ae7w",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false
});
async function run() {
  const products = await client.fetch(`*[_type == "product" && title match "Mint muse Blazer*"]`);
  console.log(JSON.stringify(products, null, 2));
}
run();
