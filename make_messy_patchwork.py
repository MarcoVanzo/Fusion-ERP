import asyncio
from playwright.async_api import async_playwright
import os
import random
from PIL import Image, ImageDraw, ImageFilter

async def take_screenshots():
    pages = [
        ("home", "http://localhost:5173/"),
        ("squadre", "http://localhost:5173/squadre"),
        ("news", "http://localhost:5173/news"),
        ("match", "http://localhost:5173/match-center"),
        ("network", "http://localhost:5173/network"),
        ("club", "http://localhost:5173/il-club"),
        ("foresteria", "http://localhost:5173/foresteria"),
        ("sponsor", "http://localhost:5173/sponsor"),
        ("store", "http://localhost:5173/store"),
        ("outseason", "http://localhost:5173/outseason"),
    ]
    
    os.makedirs("screenshots_messy", exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1600, 'height': 900})
        page = await context.new_page()
        
        for name, url in pages:
            print(f"Navigating to {url}...")
            try:
                await page.goto(url, wait_until="networkidle", timeout=15000)
                await page.wait_for_timeout(2000)
                
                # Take top screenshot
                await page.screenshot(path=f"screenshots_messy/{name}_top.png", full_page=False)
                
                # Scroll down and take another
                await page.evaluate("window.scrollBy(0, 800)")
                await page.wait_for_timeout(1000)
                await page.screenshot(path=f"screenshots_messy/{name}_mid.png", full_page=False)
                
                # Scroll down again for a 3rd piece
                await page.evaluate("window.scrollBy(0, 800)")
                await page.wait_for_timeout(1000)
                await page.screenshot(path=f"screenshots_messy/{name}_bot.png", full_page=False)
                
            except Exception as e:
                print(f"Could not process {url}: {e}")
            
        await browser.close()

def create_messy_patchwork():
    # Load all screenshots
    folder = "screenshots_messy"
    image_files = [f for f in os.listdir(folder) if f.endswith('.png')]
    images = []
    
    for f in image_files:
        try:
            img = Image.open(os.path.join(folder, f)).convert("RGBA")
            images.append(img)
        except Exception:
            pass
            
    # We want a very messy collage layout, layered randomly
    canvas_w = 4000
    canvas_h = 2400
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (12, 12, 12, 255))
    
    # Shuffle images to layer them randomly
    random.shuffle(images)
    
    # Ensure 'home_top' or something similar is near the top or drawn last to be visible
    # We'll just sort them slightly or draw home_top at the very end
    
    def add_drop_shadow(img, offset=(15, 15), blur_radius=30, color=(0, 0, 0, 180)):
        shadow = Image.new('RGBA', img.size, color)
        # Create a blank image with padding for the shadow
        padding = blur_radius * 2
        shadow_canvas = Image.new('RGBA', (img.width + padding*2, img.height + padding*2), (0,0,0,0))
        shadow_canvas.paste(shadow, (padding + offset[0], padding + offset[1]))
        shadow_canvas = shadow_canvas.filter(ImageFilter.GaussianBlur(blur_radius))
        
        # Paste original image over shadow
        shadow_canvas.paste(img, (padding, padding), img)
        return shadow_canvas
        
    def add_pink_border(img, border_size=4):
        bordered = Image.new("RGBA", (img.width + border_size*2, img.height + border_size*2), (255, 0, 128, 255))
        bordered.paste(img, (border_size, border_size))
        return bordered

    # Place items randomly with some bias towards center cluster
    for i, img in enumerate(images):
        raw_scale = random.uniform(0.4, 0.8)
        new_w = int(img.width * raw_scale)
        new_h = int(img.height * raw_scale)
        
        img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Occasionally crop a piece to make it look like a torn/cut patchwork piece
        if random.random() > 0.6:
            # Crop a square or rectangle
            crop_w = int(new_w * random.uniform(0.5, 0.9))
            crop_h = int(new_h * random.uniform(0.5, 0.9))
            crop_x = random.randint(0, new_w - crop_w)
            crop_y = random.randint(0, new_h - crop_h)
            img_resized = img_resized.crop((crop_x, crop_y, crop_x + crop_w, crop_y + crop_h))
        
        # Add thin pink/magenta border sometimes
        if random.random() > 0.3:
            img_resized = add_pink_border(img_resized, random.choice([2, 4, 6]))
            
        # Add shadow
        img_shadow = add_drop_shadow(img_resized)
        
        # Random rotation
        angle = random.uniform(-25, 25)
        # Random position (clustered toward middle)
        center_x = canvas_w // 2
        center_y = canvas_h // 2
        
        # Gaussian distribution around center
        pos_x = int(random.gauss(center_x, canvas_w/4)) - img_shadow.width // 2
        pos_y = int(random.gauss(center_y, canvas_h/4)) - img_shadow.height // 2
        
        # Rotate image with shadow
        img_rotated = img_shadow.rotate(angle, expand=True, fillcolor=(0,0,0,0))
        
        canvas.paste(img_rotated, (pos_x, pos_y), img_rotated)
        
    # Put a hero image explicitly near the center on top
    try:
        home_hero = Image.open("screenshots_messy/home_top.png").convert("RGBA")
        home_hero = home_hero.resize((1600, 900), Image.Resampling.LANCZOS)
        home_hero = add_pink_border(home_hero, 8)
        home_hero = add_drop_shadow(home_hero, blur_radius=50)
        home_hero = home_hero.rotate(5, expand=True, fillcolor=(0,0,0,0))
        
        hx = (canvas_w - home_hero.width) // 2
        hy = (canvas_h - home_hero.height) // 2
        canvas.paste(home_hero, (hx, hy), home_hero)
    except Exception:
        pass
        
    out_path = "/Users/marcovanzo/.gemini/antigravity/brain/ad4b2cfb-9cc4-4b42-b041-5b5d0acf5cea/messy_website_patchwork.png"
    canvas.convert("RGB").save(out_path, quality=95)
    print(f"Saved chaotic patchwork to {out_path}")

async def main():
    await take_screenshots()
    create_messy_patchwork()

if __name__ == "__main__":
    asyncio.run(main())
