"""Reproducible pixel assets generated from cat-art.js (Node + Pillow)."""
import json, subprocess
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
data = json.loads(subprocess.check_output(['node', str(ROOT/'scripts/export-art.cjs')]))
assets = ROOT/'assets'
assets.mkdir(exist_ok=True)
def paint(shapes):
    image = Image.new('RGBA', (64,64))
    draw = ImageDraw.Draw(image)
    for shape in shapes:
        color = shape['color']
        if shape['kind'] == 'rect':
            x1,y1,x2,y2 = shape['box']
            draw.rectangle((round(x1),round(y1),round(x2)-1,round(y2)-1),fill=color)
        elif shape['kind'] == 'polygon':
            # Rasterize on pixel centers, matching the filled canvas polygon.
            points = shape['points']
            for y in range(64):
                hits=[]
                for a,b in zip(points,points[1:]+points[:1]):
                    if min(a[1],b[1]) <= y+.5 < max(a[1],b[1]):
                        hits.append(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]))
                hits.sort()
                for left,right in zip(hits[::2],hits[1::2]):
                    for x in range(max(0,int(left)),min(64,int(right)+1)):
                        if left <= x+.5 < right: draw.point((x,y),fill=color)
        elif shape['kind'] == 'text':
            x,y=shape['point']
            draw.text((x,y-7),shape['value'],fill=color,font_size=8)
    return image
frames = {state:[paint(shapes) for shapes in variants] for state,variants in data.items()}
icon=frames['idle'][4].resize((256,256),Image.Resampling.NEAREST)
icon.save(assets/'icon.png')
icon.save(assets/'icon.ico',sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
atlas=Image.new('RGBA',(64*8,64*len(frames)))
for row,(state,variants) in enumerate(frames.items()):
    for col,frame in enumerate(variants):atlas.paste(frame,(col*64,row*64))
atlas.save(assets/'sprites.png')
(assets/'sprites.json').write_text(json.dumps({'frameWidth':64,'frameHeight':64,'columns':8,'rows':list(frames),'frameDurationMs':300},ensure_ascii=False,indent=2),encoding='utf-8')
preview=[]
for i in range(8):
    sheet=Image.new('RGB',(880,650),'#f8f6f0');draw=ImageDraw.Draw(sheet)
    draw.text((28,20),'TANGERINE / LITTLE DESKTOP COMPANY',fill='#647756',font_size=20)
    for n,(state,variants) in enumerate(frames.items()):
        x=20+(n%4)*218;y=65+(n//4)*192
        draw.rounded_rectangle((x,y,x+205,y+178),radius=14,fill='#f1e8d6')
        sprite=variants[i].resize((160,160),Image.Resampling.NEAREST)
        sheet.paste(sprite,(x+22,y+1),sprite)
        draw.text((x+14,y+153),state.upper(),fill='#8b7961',font_size=13)
    preview.append(sheet)
preview[0].save(assets/'preview.png')
preview[0].save(assets/'preview.gif',save_all=True,append_images=preview[1:],duration=300,loop=0)
print('Generated icon.png, icon.ico, sprites atlas, and animated preview.')
