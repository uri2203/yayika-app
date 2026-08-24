from PIL import Image, ImageDraw
import numpy as np
import os

ASSETS = r"C:\Users\Sistemas\yayika-app\assets"
SRC = os.path.join(ASSETS, "Logo yayika.jpg")

img = Image.open(SRC).convert("RGBA")
w, h = img.size
print(f"Logo original: {w}x{h}")

# --- 1. icon.png: 1024x1024 con fondo blanco ---
icon = img.resize((1024, 1024), Image.LANCZOS)
bg = Image.new("RGBA", (1024, 1024), (255, 255, 255, 255))
bg.paste(icon, (0, 0), icon)
bg.convert("RGB").save(os.path.join(ASSETS, "icon.png"))
print("icon.png: 1024x1024")

# --- 2. splash-icon.png: 1024x1024 ---
icon.save(os.path.join(ASSETS, "splash-icon.png"))
print("splash-icon.png: 1024x1024")

# --- 3. favicon.png: 48x48 ---
favicon = img.resize((48, 48), Image.LANCZOS)
favicon.convert("RGB").save(os.path.join(ASSETS, "favicon.png"))
print("favicon.png: 48x48")

# --- 4. Android adaptive icon ---
# Foreground: logo sobre fondo transparente
fg = img.resize((432, 432), Image.LANCZOS)
fg.save(os.path.join(ASSETS, "android-icon-foreground.png"))
print("android-icon-foreground.png: 432x432")

# Background: sólido púrpura (#8B2D8B)
bg_solid = Image.new("RGBA", (432, 432), (139, 45, 139, 255))
bg_solid.save(os.path.join(ASSETS, "android-icon-background.png"))
print("android-icon-background.png: 432x432 púrpura")

# Monochrome: escala de grises del logo
gray = img.convert("L").resize((432, 432), Image.LANCZOS)
# Invertir: fondo blanco, logo negro
gray_arr = np.array(gray)
gray_arr = 255 - gray_arr
gray_inv = Image.fromarray(gray_arr).convert("L")
# Fondo blanco sólido
mono_bg = Image.new("L", (432, 432), 255)
mono_bg.paste(gray_inv, (0, 0))
mono_bg.save(os.path.join(ASSETS, "android-icon-monochrome.png"))
print("android-icon-monochrome.png: 432x432 mono")

print("\nTodos los iconos generados desde Logo yayika.jpg")
