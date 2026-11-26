import sys, glob, os
from PIL import Image, ImageDraw
d = sys.argv[1]; fs = sorted(glob.glob(d + '/t_*.jpg'), key=lambda f: float(os.path.basename(f)[2:-4]))
w, h = 360, 640; cols = min(len(fs), int(sys.argv[2]) if len(sys.argv) > 2 else 3); rows = (len(fs) + cols - 1) // cols
o = Image.new('RGB', (w * cols, h * rows), 'white'); dr = ImageDraw.Draw(o)
for i, f in enumerate(fs):
    o.paste(Image.open(f).resize((w, h)), ((i % cols) * w, (i // cols) * h)); dr.text(((i % cols) * w + 6, (i // cols) * h + 6), os.path.basename(f)[2:-4], fill='red')
o.save(d + '/sheet.jpg', quality=85)
