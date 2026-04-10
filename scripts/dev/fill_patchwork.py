import os
import random
from PIL import Image, ImageDraw, ImageFilter

def create_dense_patchwork():
    folder = "screenshots_messy"
    image_files = [f for f in os.listdir(folder) if f.endswith('.png')]
    images = []
    
    for f in image_files:
        try:
            img = Image.open(os.path.join(folder, f)).convert("RGBA")
            images.append(img)
        except Exception:
            pass
            
    canvas_w = 4000
    canvas_h = 2400
    # Base background can be dark, but we aim to cover it entirely
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (12, 12, 12, 255))
    
    def add_drop_shadow(img, offset=(15, 15), blur_radius=30, color=(0, 0, 0, 200)):
        shadow = Image.new('RGBA', img.size, color)
        padding = blur_radius * 2
        shadow_canvas = Image.new('RGBA', (img.width + padding*2, img.height + padding*2), (0,0,0,0))
        shadow_canvas.paste(shadow, (padding + offset[0], padding + offset[1]))
        shadow_canvas = shadow_canvas.filter(ImageFilter.GaussianBlur(blur_radius))
        
        shadow_canvas.paste(img, (padding, padding), img)
        return shadow_canvas
        
    def add_pink_border(img, border_size=4):
        bordered = Image.new("RGBA", (img.width + border_size*2, img.height + border_size*2), (255, 0, 128, 255))
        bordered.paste(img, (border_size, border_size))
        return bordered

    # To fill the image, we'll create a grid of centers and perturb them, 
    # to guarantee coverage everywhere, then add random ones on top.
    
    # Layer 1: Background Fillers (Very large pieces to cover black areas)
    print("Generating background layer...")
    bg_pieces = 30
    for i in range(bg_pieces):
        img = random.choice(images)
        raw_scale = random.uniform(1.2, 1.8) # scale up a lot
        new_w = int(img.width * raw_scale)
        new_h = int(img.height * raw_scale)
        
        img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Random position anywhere
        pos_x = random.randint(-new_w//2, canvas_w - new_w//2)
        pos_y = random.randint(-new_h//2, canvas_h - new_h//2)
        
        angle = random.uniform(-15, 15)
        img_rotated = img_resized.rotate(angle, expand=True, fillcolor=(0,0,0,0))
        
        canvas.paste(img_rotated, (pos_x, pos_y), img_rotated)
        
    # Layer 2: Medium/Dense Filler Grid (Ensure no obvious gaps)
    print("Generating middle layer...")
    cell_w = canvas_w // 5
    cell_h = canvas_h // 4
    for grid_x in range(6):
        for grid_y in range(5):
            img = random.choice(images)
            raw_scale = random.uniform(0.6, 1.0)
            new_w = int(img.width * raw_scale)
            new_h = int(img.height * raw_scale)
            
            img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            # Crop to make square/rect pieces that fit nicely
            if random.random() > 0.4:
                crop_w = int(new_w * random.uniform(0.6, 0.9))
                crop_h = int(new_h * random.uniform(0.6, 0.9))
                crop_x = random.randint(0, new_w - crop_w)
                crop_y = random.randint(0, new_h - crop_h)
                img_resized = img_resized.crop((crop_x, crop_y, crop_x + crop_w, crop_y + crop_h))
                
            img_shadow = add_drop_shadow(img_resized, blur_radius=40)
            
            angle = random.uniform(-30, 30)
            
            # Perturb grid center
            pos_x = (grid_x * cell_w) + random.randint(-200, 200) - img_shadow.width//2
            pos_y = (grid_y * cell_h) + random.randint(-200, 200) - img_shadow.height//2
            
            img_rotated = img_shadow.rotate(angle, expand=True, fillcolor=(0,0,0,0))
            canvas.paste(img_rotated, (pos_x, pos_y), img_rotated)

    # Layer 3: Foreground / Highlight Pieces (sharp, pink borders, prominent)
    print("Generating foreground layer...")
    fg_pieces = 20
    for i in range(fg_pieces):
        img = random.choice(images)
        raw_scale = random.uniform(0.5, 0.9)
        new_w = int(img.width * raw_scale)
        new_h = int(img.height * raw_scale)
        
        img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        img_resized = add_pink_border(img_resized, random.choice([4, 6, 8]))
        img_shadow = add_drop_shadow(img_resized)
        
        # Center weighted distribution
        pos_x = int(random.gauss(canvas_w/2, canvas_w/3)) - img_shadow.width // 2
        pos_y = int(random.gauss(canvas_h/2, canvas_h/3)) - img_shadow.height // 2
        
        angle = random.uniform(-20, 20)
        img_rotated = img_shadow.rotate(angle, expand=True, fillcolor=(0,0,0,0))
        
        canvas.paste(img_rotated, (pos_x, pos_y), img_rotated)
        
    # Hero image on top
    try:
        home_hero = Image.open("screenshots_messy/home_top.png").convert("RGBA")
        # Ensure it scales impressively. Home top might be 1600x900, let's make it 2000x1125
        home_hero = home_hero.resize((2000, 1125), Image.Resampling.LANCZOS)
        home_hero = add_pink_border(home_hero, 12)
        home_hero = add_drop_shadow(home_hero, blur_radius=80, color=(0, 0, 0, 220))
        home_hero = home_hero.rotate(3, expand=True, fillcolor=(0,0,0,0)) # Slight rotation 
        
        hx = (canvas_w - home_hero.width) // 2
        hy = (canvas_h - home_hero.height) // 2
        canvas.paste(home_hero, (hx, hy), home_hero)
    except Exception as e:
        print(f"Error drawing home hero: {e}")
        
    out_path = "/Users/marcovanzo/.gemini/antigravity/brain/ad4b2cfb-9cc4-4b42-b041-5b5d0acf5cea/filled_website_patchwork.png"
    canvas.convert("RGB").save(out_path, quality=95)
    print(f"Saved filled chaotic patchwork to {out_path}")

if __name__ == "__main__":
    create_dense_patchwork()
