import os
from PIL import Image, ImageDraw

def create_graduation_cap(size):
    # Create transparent image
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    
    # Scale coordinates based on size
    scale = size / 100.0
    
    # Brand blue color: #2563eb (Vibrant brand blue)
    brand_blue = (37, 99, 235, 255)
    # Tassel gold color: #f59e0b
    tassel_gold = (245, 158, 11, 255)
    
    # Mortarboard diamond (points: Top, Right, Bottom, Left)
    diamond_pts = [
        (50 * scale, 15 * scale),  # Top
        (90 * scale, 40 * scale),  # Right
        (50 * scale, 65 * scale),  # Bottom
        (10 * scale, 40 * scale)   # Left
    ]
    draw.polygon(diamond_pts, fill=brand_blue)
    
    # Skull cap underneath
    cap_pts = [
        (30 * scale, 52 * scale),
        (30 * scale, 75 * scale),
        (50 * scale, 85 * scale),
        (70 * scale, 75 * scale),
        (70 * scale, 52 * scale),
        (50 * scale, 60 * scale)
    ]
    draw.polygon(cap_pts, fill=brand_blue)
    
    # Tassel line from center to right side
    tassel_line = [
        (50 * scale, 40 * scale),
        (82 * scale, 50 * scale),
        (82 * scale, 70 * scale)
    ]
    draw.line(tassel_line, fill=tassel_gold, width=max(1, int(3 * scale)))
    
    # Tassel circle/fringe at the end
    r = 4 * scale
    draw.ellipse([82*scale - r, 70*scale - r, 82*scale + r, 70*scale + r], fill=tassel_gold)
    
    return image

# Ensure public/ directory exists
os.makedirs("public", exist_ok=True)

# Generate high-res base image
img_512 = create_graduation_cap(512)

# Resize to target resolutions
img_16 = img_512.resize((16, 16), Image.Resampling.LANCZOS)
img_32 = img_512.resize((32, 32), Image.Resampling.LANCZOS)
img_48 = img_512.resize((48, 48), Image.Resampling.LANCZOS)
img_180 = img_512.resize((180, 180), Image.Resampling.LANCZOS)

# Save output assets
img_16.save("public/favicon-16x16.png", "PNG")
img_32.save("public/favicon-32x32.png", "PNG")
img_180.save("public/apple-touch-icon.png", "PNG")

# Save combined multi-resolution favicon.ico
img_512.save("public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
print("Favicons generated successfully in public/ directory!")
