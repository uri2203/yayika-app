"""
Yayika App Icon - EXACT reference design
Smooth oval leaves, 4-point star, cross, glow
"""
import os
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse
from PIL import Image, ImageDraw, ImageFilter

SIZE = 1024
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets')


def draw_oval_leaf(ax, x, y, angle, length, width, color, alpha):
    """Draw a smooth oval leaf using matplotlib Ellipse."""
    leaf = Ellipse((x, y), length, width, angle=np.degrees(angle), 
                   facecolor=color, edgecolor='none', alpha=alpha)
    ax.add_patch(leaf)


def draw_symbol(ax, lw=12, alpha=1.0, color='#D7AF46'):
    """Draw the exact reference design."""
    
    # === VERTICAL STEM (long, going down) ===
    ax.plot([0, 0], [50, -300], color=color, linewidth=lw, alpha=alpha, solid_capstyle='round')
    
    # === CROSSBAR (horizontal at bottom) ===
    ax.plot([-90, 90], [-300, -300], color=color, linewidth=lw, alpha=alpha, solid_capstyle='round')
    
    # === 4-POINTED STAR (at top of stem) ===
    star_cy = 55
    # Draw 4 diamond points
    for angle_deg in [0, 90, 180, 270]:
        angle_rad = np.radians(angle_deg)
        tip_r = 28
        inner_r = 6
        
        tip_x = tip_r * np.cos(angle_rad)
        tip_y = star_cy + tip_r * np.sin(angle_rad)
        
        perp = angle_rad + np.pi/2
        ix = inner_r * np.cos(perp)
        iy = inner_r * np.sin(perp)
        
        diamond = plt.Polygon([
            (0, star_cy),
            (ix, star_cy + iy),
            (tip_x, tip_y),
            (-ix, star_cy - iy),
        ], closed=True, facecolor=color, edgecolor='none', alpha=alpha)
        ax.add_patch(diamond)
    
    # === LEFT BRANCH (curves up-left from star) ===
    n_leaves = 6
    # Branch path: curve going up-left
    for i in range(n_leaves):
        t = i / (n_leaves - 1)
        # Smooth curve upward-left
        bx = -t * 180
        by = 80 + t * 200 - t * t * 60
        
        # Stem segment
        if i > 0:
            prev_t = (i - 1) / (n_leaves - 1)
            px = -prev_t * 180
            py = 80 + prev_t * 200 - prev_t * prev_t * 60
            ax.plot([px, bx], [py, by], color=color, linewidth=max(2, lw//4), alpha=alpha*0.6, solid_capstyle='round')
        
        # Smooth oval leaf (perpendicular to branch, pointing outward-up)
        leaf_angle = np.radians(120 + t * 20)  # pointing up-left
        leaf_len = 35 + 5 * np.sin(t * np.pi)
        leaf_w = 14
        
        draw_oval_leaf(ax, bx, by, leaf_angle, leaf_len, leaf_w, color, alpha * 0.75)
    
    # === RIGHT BRANCH (mirror) ===
    for i in range(n_leaves):
        t = i / (n_leaves - 1)
        bx = t * 180
        by = 80 + t * 200 - t * t * 60
        
        if i > 0:
            prev_t = (i - 1) / (n_leaves - 1)
            px = prev_t * 180
            py = 80 + prev_t * 200 - prev_t * prev_t * 60
            ax.plot([px, bx], [py, by], color=color, linewidth=max(2, lw//4), alpha=alpha*0.6, solid_capstyle='round')
        
        leaf_angle = np.radians(60 - t * 20)  # pointing up-right
        leaf_len = 35 + 5 * np.sin(t * np.pi)
        leaf_w = 14
        
        draw_oval_leaf(ax, bx, by, leaf_angle, leaf_len, leaf_w, color, alpha * 0.75)


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Generating Yayika icon - EXACT reference design...")
    
    gold = '#D7AF46'
    
    layers = []
    glow_params = [
        (22, 0.04, 3.5),
        (14, 0.08, 3.0),
        (9, 0.15, 2.5),
        (5, 0.3, 2.0),
        (2, 0.6, 1.5),
        (0, 1.0, 1.0),
    ]
    
    for blur_r, alpha_mult, lw_mult in glow_params:
        fig, ax = plt.subplots(figsize=(10.24, 10.24), dpi=100)
        ax.set_xlim(-400, 400)
        ax.set_ylim(-400, 420)
        ax.set_aspect('equal')
        ax.axis('off')
        fig.patch.set_facecolor('none')
        
        draw_symbol(ax, lw=int(12 * lw_mult), alpha=min(1.0, alpha_mult), color=gold)
        
        temp = os.path.join(OUTPUT_DIR, '_layer.png')
        fig.savefig(temp, dpi=100, transparent=True, pad_inches=0, bbox_inches='tight')
        plt.close()
        
        layer = Image.open(temp).convert('RGBA')
        layer = layer.resize((SIZE, SIZE), Image.LANCZOS)
        if blur_r > 0:
            layer = layer.filter(ImageFilter.GaussianBlur(radius=blur_r))
        layers.append(layer)
    
    # Composite
    canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(canvas).ellipse([0, 0, SIZE-1, SIZE-1], fill='#1A0E2E')
    for layer in layers:
        canvas = Image.alpha_composite(canvas, layer)
    
    # Bloom
    bloom = canvas.copy().filter(ImageFilter.GaussianBlur(radius=10))
    ba = np.array(bloom).astype(np.float32)
    ba[:,:,3] = np.clip(ba[:,:,3] * 0.08, 0, 255)
    bloom = Image.fromarray(ba.astype(np.uint8), 'RGBA')
    canvas = Image.alpha_composite(bloom, canvas)
    
    # Round corners
    cm = Image.new('L', (SIZE, SIZE), 0)
    d = ImageDraw.Draw(cm)
    r = 100
    d.rectangle([r, 0, SIZE-r, SIZE], fill=255)
    d.rectangle([0, r, SIZE, SIZE-r], fill=255)
    d.pieslice([0, 0, 2*r, 2*r], 180, 270, fill=255)
    d.pieslice([SIZE-2*r, 0, SIZE, 2*r], 270, 360, fill=255)
    d.pieslice([0, SIZE-2*r, 2*r, SIZE], 90, 180, fill=255)
    d.pieslice([SIZE-2*r, SIZE-2*r, SIZE, SIZE], 0, 90, fill=255)
    
    ia = np.array(canvas)
    ia[:,:,3] = np.where(np.array(cm) > 0, ia[:,:,3], 0)
    icon = Image.fromarray(ia, 'RGBA')
    
    icon.save(os.path.join(OUTPUT_DIR, 'icon.png'))
    icon.save(os.path.join(OUTPUT_DIR, 'splash-icon.png'))
    
    # Foreground
    ia_icon = np.array(icon)
    bright = (ia_icon[:,:,0] > 60) & (ia_icon[:,:,3] > 20)
    fg_arr = np.zeros((SIZE, SIZE, 4), dtype=np.uint8)
    fg_arr[bright] = ia_icon[bright]
    Image.fromarray(fg_arr, 'RGBA').save(os.path.join(OUTPUT_DIR, 'android-icon-foreground.png'))
    
    # Background
    bg = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(bg).ellipse([0, 0, SIZE-1, SIZE-1], fill='#1A0E2E')
    bg.save(os.path.join(OUTPUT_DIR, 'android-icon-background.png'))
    
    # Monochrome
    a = np.array(icon)[:,:,3]
    mono = np.zeros((SIZE, SIZE, 4), dtype=np.uint8)
    mono[a > 15] = [255, 255, 255, 255]
    Image.fromarray(mono, 'RGBA').save(os.path.join(OUTPUT_DIR, 'android-icon-monochrome.png'))
    
    os.remove(temp)
    for f in ['icon.png', 'android-icon-foreground.png', 'android-icon-background.png',
              'android-icon-monochrome.png', 'splash-icon.png']:
        fp = os.path.join(OUTPUT_DIR, f)
        im = Image.open(fp)
        kb = os.path.getsize(fp) / 1024
        print(f"  {f}: {im.size[0]}x{im.size[1]}, {kb:.0f}KB")
    print("Done!")


if __name__ == '__main__':
    main()
