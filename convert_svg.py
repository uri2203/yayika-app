"""Convert SVG icon to PNG using matplotlib."""
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from PIL import Image
import numpy as np

SIZE = 1024
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets')

# Method: Use svglib + reportlab
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM

svg_path = os.path.join(OUTPUT_DIR, 'icon.svg')
temp_png = os.path.join(OUTPUT_DIR, '_temp_render.png')

print("Converting SVG to PNG...")

# Try svglib
try:
    drawing = svg2rlg(svg_path)
    if drawing:
        # Scale to 1024x1024
        scale = SIZE / max(drawing.width, drawing.height)
        drawing.width = SIZE
        drawing.height = SIZE
        drawing.scale(scale, scale)
        
        renderPM.drawToFile(drawing, temp_png, fmt='PNG', dpi=150)
        print("  svglib conversion successful")
        
        img = Image.open(temp_png).convert('RGBA')
        img = img.resize((SIZE, SIZE), Image.LANCZOS)
    else:
        raise Exception("svg2rlg returned None")
except Exception as e:
    print(f"  svglib failed: {e}")
    print("  Trying matplotlib fallback...")
    
    # Fallback: render SVG with matplotlib
    fig, ax = plt.subplots(figsize=(10.24, 10.24), dpi=100)
    ax.set_xlim(0, 1024)
    ax.set_ylim(0, 1024)
    ax.set_aspect('equal')
    ax.axis('off')
    
    # Draw purple circle
    circle = plt.Circle((512, 512), 490, color='#321E50')
    ax.add_patch(circle)
    
    # Draw woman silhouette using bezier paths
    from matplotlib.path import Path
    import matplotlib.patches as patches
    
    # Woman path (simplified but recognizable)
    verts = [
        # Head
        (512, 160), (545, 160), (570, 185), (570, 220),
        (570, 255), (545, 280), (512, 280),
        (479, 280), (454, 255), (454, 220),
        (454, 185), (479, 160), (512, 160),
        # Neck
        (512, 280), (490, 310), (490, 340),
        (512, 340), (534, 340), (534, 310), (512, 310),
        # Right arm up
        (534, 330), (590, 280), (700, 130),
        (820, 70), (835, 90), (770, 200),
        (640, 380), (534, 440), (534, 330),
        # Left arm up
        (490, 330), (434, 280), (324, 130),
        (204, 70), (189, 90), (254, 200),
        (384, 380), (490, 440), (490, 330),
        # Body
        (490, 380), (478, 520), (470, 700),
        (464, 790), (480, 840), (512, 820),
        (544, 840), (560, 790), (554, 700),
        (546, 520), (534, 380),
        # Skirt
        (480, 520), (460, 640), (430, 780),
        (430, 840), (480, 830), (512, 760),
        (544, 830), (594, 840), (594, 780),
        (564, 640), (544, 520),
    ]
    
    codes = [Path.MOVETO] + [Path.CURVE4] * (len(verts) - 2) + [Path.CLOSEPOLY]
    # Fix codes
    codes = [Path.MOVETO]
    i = 1
    while i < len(verts) - 1:
        if i + 2 < len(verts) - 1:
            codes.extend([Path.CURVE4, Path.CURVE4, Path.CURVE4])
            i += 3
        else:
            codes.append(Path.LINETO)
            i += 1
    codes.append(Path.CLOSEPOLY)
    while len(codes) < len(verts):
        codes.insert(-1, Path.LINETO)
    codes = codes[:len(verts)]
    codes[-1] = Path.CLOSEPOLY
    
    path = Path(verts, codes)
    patch = patches.PathPatch(path, facecolor='#D7AF46', edgecolor='none')
    ax.add_patch(patch)
    
    plt.subplots_adjust(left=0, right=1, top=1, bottom=0)
    fig.savefig(temp_png, dpi=100, facecolor='#321E50', pad_inches=0)
    plt.close()
    
    img = Image.open(temp_png).convert('RGBA')
    img = img.resize((SIZE, SIZE), Image.LANCZOS)

# Round corners
from PIL import ImageDraw
cm = Image.new('L', (SIZE, SIZE), 0)
d = ImageDraw.Draw(cm)
r = 100
d.rectangle([r, 0, SIZE-r, SIZE], fill=255)
d.rectangle([0, r, SIZE, SIZE-r], fill=255)
d.pieslice([0, 0, 2*r, 2*r], 180, 270, fill=255)
d.pieslice([SIZE-2*r, 0, SIZE, 2*r], 270, 360, fill=255)
d.pieslice([0, SIZE-2*r, 2*r, SIZE], 90, 180, fill=255)
d.pieslice([SIZE-2*r, SIZE-2*r, SIZE, SIZE], 0, 90, fill=255)

ia = np.array(img)
ia[:,:,3] = np.where(np.array(cm) > 0, ia[:,:,3], 0)
icon = Image.fromarray(ia, 'RGBA')

icon.save(os.path.join(OUTPUT_DIR, 'icon.png'))
icon.save(os.path.join(OUTPUT_DIR, 'splash-icon.png'))

# Foreground
fg = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
# Extract just the gold shape
ia2 = np.array(icon)
# Remove purple background pixels
purple_mask = (ia2[:,:,0] < 80) & (ia2[:,:,1] < 60) & (ia2[:,:,2] > 40)
ia2[purple_mask] = [0, 0, 0, 0]
fg = Image.fromarray(ia2, 'RGBA')
fg.save(os.path.join(OUTPUT_DIR, 'android-icon-foreground.png'))

# Background
bg = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
ImageDraw.Draw(bg).ellipse([0, 0, SIZE-1, SIZE-1], fill='#321E50')
bg.save(os.path.join(OUTPUT_DIR, 'android-icon-background.png'))

# Monochrome
a = np.array(fg)[:,:,3]
mono = np.zeros((SIZE, SIZE, 4), dtype=np.uint8)
mono[a > 10] = [255, 255, 255, 255]
Image.fromarray(mono, 'RGBA').save(os.path.join(OUTPUT_DIR, 'android-icon-monochrome.png'))

# Cleanup
if os.path.exists(temp_png):
    os.remove(temp_png)

for f in ['icon.png', 'android-icon-foreground.png', 'android-icon-background.png',
          'android-icon-monochrome.png', 'splash-icon.png']:
    fp = os.path.join(OUTPUT_DIR, f)
    im = Image.open(fp)
    kb = os.path.getsize(fp) / 1024
    print(f"  {f}: {im.size[0]}x{im.size[1]}, {kb:.0f}KB")
print("Done!")
