import json, subprocess, os, shutil
D="frames6"; F=json.load(open(f"{D}/frames.json")); M=json.load(open(f"{D}/marks.json"))
T=[x[1] for x in F]; t0=T[0]; tend=T[-1]+0.1
segs=[(t0,M["splash_end"],1,1.0),(M["splash_end"],M["onb_end"],2,1.5),(M["s2_start"],M["s2_end"],3,1.15),(M["s3_start"],M["s3_end"],4,1.0),(M["s4_start"],M["s4_end"],5,1.0)]
FOREST="0x1e3a2f"
shutil.rmtree("seg",ignore_errors=True); os.makedirs("seg")
common=["-c:v","libx264","-crf","17","-preset","slow","-pix_fmt","yuv420p",
        "-r","60","-g","120","-bf","3","-refs","4","-profile:v","high","-level","4.2",
        "-x264-params","aq-mode=3"]
parts=[]
for i,(a,z,card,sp) in enumerate(segs):
    idx=[k for k,t in enumerate(T) if a<=t<z]
    with open(f"seg/l{i}.txt","w") as o:
        for j,k in enumerate(idx):
            nxt=T[idx[j+1]] if j+1<len(idx) else z
            o.write(f"file '../{D}/{F[k][0]}'\nduration {max(nxt-T[k],0.001):.4f}\n")
        o.write(f"file '../{D}/{F[idx[-1]][0]}'\n")
    dur=(z-a)/sp; vf=[f"setpts=PTS/{sp}","fps=60","scale=1080:1920","format=yuv420p"]
    if i>0: vf.append(f"fade=t=in:st=0:d=0.22:color={FOREST}")
    if card: vf.append(f"fade=t=out:st={dur-0.22:.3f}:d=0.22:color={FOREST}")
    else: vf+= ["tpad=stop_mode=clone:stop_duration=0.6",f"fade=t=out:st={dur+0.6-0.3:.3f}:d=0.3:color={FOREST}"]
    out=f"seg/s{i}.mp4"
    subprocess.run(["ffmpeg","-v","error","-y","-f","concat","-safe","0","-i",f"seg/l{i}.txt","-vf",",".join(vf)]+common+["-movflags","+faststart","tmp_seg.mp4"],check=True)
    os.rename("tmp_seg.mp4",out); parts.append(out)
    if card:
        co=f"seg/c{card}.mp4"
        subprocess.run(["ffmpeg","-v","error","-y","-framerate","60","-i",f"cards/c{card}/%04d.png","-vf","format=yuv420p"]+common+["tmp_c.mp4"],check=True)
        os.rename("tmp_c.mp4",co); parts.append(co)
    print("segment",i,round(dur,1),"s")
with open("seg/all.txt","w") as o:
    for p in parts: o.write(f"file '{os.path.basename(p)}'\n")
# piste audio muette : certaines plateformes et lecteurs refusent une vidéo sans son
subprocess.run(["ffmpeg","-v","error","-y","-f","concat","-safe","0","-i","seg/all.txt",
                "-f","lavfi","-i","anullsrc=channel_layout=stereo:sample_rate=48000",
                "-c:v","copy","-c:a","aac","-b:a","96k","-shortest",
                "-movflags","+faststart","tmp_all.mp4"],check=True)
os.rename("tmp_all.mp4","sharewood-promo-final.mp4")
print("final :", subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
      "-of","default=nw=1:nk=1","sharewood-promo-final.mp4"],capture_output=True,text=True).stdout.strip(),"s")
