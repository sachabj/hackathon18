import os, shutil
from PIL import Image, ImageDraw, ImageFont
W,H,FPS,DUR=1080,1920,60,1.5
FOREST=(30,58,47); CREAM=(250,249,245); SAGE=(207,227,202); AUB=(75,42,99)
TF=ImageFont.truetype("fonts/newsreader-500.ttf",104); SF=ImageFont.truetype("fonts/inter-400.ttf",50)
logo=Image.open("cards/logo.png").convert("RGBA")
CARDS=[("Un profil qui\nte ressemble",""),("Repère les\nvrais bons plans",""),("Partage en\nquelques secondes",""),("Solidarité\nrécompensée",""),("ShareWood","")]
def wrap(d,text,font,maxw):
    out=[]
    for para in text.split("\n"):
        line=""
        for w in para.split(" "):
            t=(line+" "+w).strip()
            if d.textlength(t,font=font)<=maxw: line=t
            else: out.append(line); line=w
        out.append(line)
    return out
def layer(lines,font,color,lh,cx,y):
    im=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(im)
    for i,l in enumerate(lines): d.text((cx,y+i*lh),l,font=font,fill=color,anchor="mt")
    return im
ease=lambda k:1-(1-max(0,min(1,k)))**3
for ci,(title,sub) in enumerate(CARDS,1):
    d0=ImageDraw.Draw(Image.new("RGB",(10,10)))
    tl=wrap(d0,title,TF,990); sl=[]
    T=layer(tl,TF,CREAM+(255,),146,W//2,0); S=Image.new('RGBA',(W,H),(0,0,0,0))
    th=len(tl)*146; sh=0
    top=(H-th)//2+120
    out=f"cards/c{ci}"; shutil.rmtree(out,ignore_errors=True); os.makedirs(out)
    n=int(FPS*DUR)
    for f in range(n):
        t=f/FPS
        a_in=lambda t0:ease((t-t0)/0.5); a_out=1-max(0,min(1,(t-(DUR-0.25))/0.25))
        base=Image.new("RGBA",(W,H),FOREST+(255,)); d=ImageDraw.Draw(base)
        # logo avec anneau
        la=ease(t/0.45)*a_out; ly=int(top-300+30*(1-ease(t/0.45)))
        ring=Image.new("RGBA",(W,H),(0,0,0,0)); dr=ImageDraw.Draw(ring)
        dr.ellipse([W//2-124,ly+110-124,W//2+124,ly+110+124],outline=SAGE+(int(255*la),),width=6)
        base.alpha_composite(ring)
        lg=logo.copy(); lg.putalpha(lg.getchannel("A").point(lambda v:int(v*la)))
        base.alpha_composite(lg,(W//2-110,ly))
        # titre + sous-titre
        for L,t0,y,h in [(T,0.1,top,th)]:
            a=a_in(t0)*a_out; off=int(46*(1-a_in(t0)))
            lay=L.crop((0,0,W,h+10)); lay.putalpha(lay.getchannel("A").point(lambda v:int(v*a)))
            base.alpha_composite(lay,(0,y+off))
        # progression
        dots=Image.new("RGBA",(W,H),(0,0,0,0)); dd=ImageDraw.Draw(dots)
        for k in (range(4) if ci<=4 else []):
            x=W//2+(k-1.5)*56; col=CREAM if k==ci-1 else (88,118,104)
            r=11 if k==ci-1 else 8
            dd.ellipse([x-r,H-250-r,x+r,H-250+r],fill=col+(int(255*a_out),))
        base.alpha_composite(dots)
        base.convert("RGB").save(f"{out}/{f:04d}.png")
    print("carte",ci,n,"images")
