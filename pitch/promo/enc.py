import json,sys,subprocess
d=sys.argv[1]; out=sys.argv[2]
f=json.load(open(f"{d}/frames.json"))
with open(f"{d}/list.txt","w") as o:
    for i,(n,t) in enumerate(f):
        dur=(f[i+1][1]-t) if i+1<len(f) else 0.1
        o.write(f"file '{n}'\nduration {max(dur,0.001):.4f}\n")
    o.write(f"file '{f[-1][0]}'\n")
