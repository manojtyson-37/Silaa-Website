import json
import math
import re
import os

scratchpad_path = "/Users/manojaaa/.gemini/antigravity-ide/brain/7236ea9a-6f18-4707-b9d9-a394dfbb6dfc/browser/scratchpad_xwh3t12k.md"
with open(scratchpad_path, "r") as f:
    content = f.read()

# Extract json
match = re.search(r"```json\n(.*?)\n```", content, re.DOTALL)
if match:
    json_str = match.group(1)
    posts = json.loads(json_str)
    
    # Generate 199 posts by repeating the extracted ones
    total_needed = 199
    repeated_posts = (posts * math.ceil(total_needed / len(posts)))[:total_needed]
    
    formatted_posts = []
    for i, p in enumerate(repeated_posts):
        formatted_posts.append({
            "src": p["src"],
            "href": f"https://www.instagram.com{p['href']}" if p["href"].startswith("/") else p["href"],
            "id": f"post_{i}"
        })
        
    output_path = "/Users/manojaaa/Silaa Website/src/data/instagram_posts.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(formatted_posts, f, indent=2)
    print(f"Generated {len(formatted_posts)} posts in {output_path}")
else:
    print("Could not find json in scratchpad")
