import instaloader
import json
import os
import time

def scrape_instagram():
    L = instaloader.Instaloader(
        download_pictures=True,
        download_video_thumbnails=False,
        download_videos=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
        post_metadata_txt_pattern=""
    )

    try:
        print("Logging in...")
        L.login("testtyson37@gmail.com", "Tysontest@411")
        print("Logged in successfully.")
    except Exception as e:
        print(f"Login failed: {e}")
        return

    profile_name = "silacollective_"
    output_dir = "/Users/manojaaa/Silaa Website/public/instagram_scraped"
    json_path = "/Users/manojaaa/Silaa Website/src/data/instagram_posts.json"

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(os.path.dirname(json_path), exist_ok=True)

    print(f"Scraping profile: {profile_name}")
    try:
        profile = instaloader.Profile.from_username(L.context, profile_name)
    except Exception as e:
        print(f"Failed to get profile: {e}")
        return

    posts_data = []
    
    print(f"Total posts: {profile.mediacount}")
    count = 0

    try:
        for post in profile.get_posts():
            if count >= 199:
                break
                
            image_url = post.url
            post_url = f"https://www.instagram.com/p/{post.shortcode}/"
            filename = f"post_{post.shortcode}.jpg"
            filepath = os.path.join(output_dir, filename)
            
            import requests
            if not os.path.exists(filepath):
                img_data = requests.get(image_url).content
                with open(filepath, 'wb') as handler:
                    handler.write(img_data)
                    
            posts_data.append({
                "src": f"/instagram_scraped/{filename}",
                "href": post_url,
                "shortcode": post.shortcode
            })
            
            count += 1
            if count % 10 == 0:
                print(f"Scraped {count} posts...")
                time.sleep(2)
                
    except Exception as e:
        print(f"Stopped early due to error: {e}")

    with open(json_path, 'w') as f:
        json.dump(posts_data, f, indent=2)

    print(f"Successfully saved {len(posts_data)} posts.")

if __name__ == "__main__":
    scrape_instagram()
