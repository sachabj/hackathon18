import os, json, base64, shutil, re, time
from playwright.sync_api import sync_playwright
B="http://localhost:3123"
HERE=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(HERE,"frames6")
shutil.rmtree(OUT,ignore_errors=True); os.makedirs(OUT)
frames=[]; rec={"on":False}; marks={}
TAP="""window.__tap=(x,y)=>{const s=document.createElement('div');s.style.cssText='position:fixed;left:'+(x-24)+'px;top:'+(y-24)+'px;width:48px;height:48px;border-radius:50%;background:rgba(75,42,99,.35);border:2px solid rgba(255,255,255,.9);z-index:2147483647;pointer-events:none;transition:transform .5s ease-out,opacity .5s ease-out';document.documentElement.appendChild(s);requestAnimationFrame(()=>{s.style.transform='scale(1.6)';s.style.opacity='0'});setTimeout(()=>s.remove(),650)};"""
DRAFT={"ok":True,"result":{"title":"-30 % pour les étudiants le mardi soir","category":"restaurant","subcategory":None,"scope":"local","store_name":"Pizza Bruz","city":"Bruz","price_info":None,"price_level":1,"description":"Pizzas à -30 % tous les mardis soir sur présentation de la carte étudiante.","tags":[],"requirements":["student_card"],"link_url":None,"expires_on":"2026-12-20","deadline_on":None,"confidence":"haute","notes":None}}
PH={"features":[{"geometry":{"coordinates":[-1.7468,48.0246]},"properties":{"osm_type":"N","osm_id":4242,"name":"Pizza Bruz (démo)","street":"Rue de Ker Lann","city":"Bruz","postcode":"35170","osm_value":"restaurant"}}]}
K=0.5
OFF=[0.0]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get("CHROME","/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),args=["--use-angle=swiftshader","--enable-unsafe-swiftshader","--hide-scrollbars"])
    c=b.new_context(viewport={"width":360,"height":640},device_scale_factor=3,is_mobile=True,has_touch=True,
        geolocation={"latitude":48.0252,"longitude":-1.7466},permissions=["geolocation"],locale="fr-FR")
    c.add_init_script(TAP)
    pg=c.new_page()
    errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)[:200]))
    def assist(route):
        pg.wait_for_timeout(1500)
        route.fulfill(status=200,content_type="application/json",body=json.dumps(DRAFT))
    pg.route("**/api/assist",assist)
    pg.route("**/photon.komoot.io/**",lambda r:r.fulfill(status=200,content_type="application/json",body=json.dumps(PH)))
    cdp=None
    def on_frame(m):
        cdp.send("Page.screencastFrameAck",{"sessionId":m["sessionId"]})
        if not rec["on"]: return
        n=f"f{len(frames):05d}.jpg"
        open(f"{OUT}/{n}","wb").write(base64.b64decode(m["data"]))
        frames.append((n,m["metadata"]["timestamp"]))
    def wait(ms): pg.wait_for_timeout(int(ms*K))
    def rwait(ms): pg.wait_for_timeout(ms)
    def tap(loc,after=900):
        el=loc.first; el.scroll_into_view_if_needed(); bb=el.bounding_box()
        if bb["y"]<70 or bb["y"]+bb["height"]>640-85:
            el.evaluate("e=>e.scrollIntoView({block:'center',behavior:'smooth'})"); wait(900)
        wait(150); bb=el.bounding_box()
        x,y=bb["x"]+bb["width"]/2,bb["y"]+bb["height"]/2
        pg.evaluate(f"window.__tap({x},{y})"); rwait(260); pg.mouse.click(x,y); wait(after)
    def typ(t,d=75):
        for ch in t: pg.keyboard.insert_text(ch); rwait(d)
    def scroll(dy):
        ms=int(max(700,abs(dy)*2.6))
        pg.evaluate("([dy,ms])=>new Promise(r=>{const y0=scrollY,t0=performance.now();const f=t=>{const k=Math.min(1,(t-t0)/ms);const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;scrollTo(0,y0+dy*e);k<1?requestAnimationFrame(f):r()};requestAnimationFrame(f)})",[dy,ms])
    def swipe_chips(dx,ms=800):
        pg.evaluate("([dx,ms])=>new Promise(r=>{const e=document.querySelector('[role=group][aria-label=Filtres]');const x0=e.scrollLeft,t0=performance.now();const f=t=>{const k=Math.min(1,(t-t0)/ms);const s=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;e.scrollLeft=x0+dx*s;k<1?requestAnimationFrame(f):r()};requestAnimationFrame(f)})",[dx,ms])
    def btn(name): return pg.get_by_role("button",name=re.compile(name))
    def nav(name): return pg.locator("nav").get_by_role("link",name=re.compile(name))
    def cont(after=600): tap(pg.locator("div.fixed button.sw-btn-primary"),after)
    def mark(n): rwait(70); marks[n]=time.time()+OFF[0]
    # connexion hors caméra
    pg.goto(B+"/login"); rwait(1200)
    pg.fill('input[type="email"]',"sarah@example.com"); pg.fill('input[type="password"]',"motdepasse")
    pg.click("form button:not([type])")
    pg.wait_for_function("location.pathname==='/'",timeout=20000); rwait(600)
    pg.goto(B+"/onboarding",wait_until="commit")
    # la session CDP est créée ici : une navigation peut détacher une session ouverte avant
    cdp=c.new_cdp_session(pg)
    cdp.on("Page.screencastFrame",on_frame)
    cdp.send("Page.startScreencast",{"format":"jpeg","quality":96,"maxWidth":1080,"maxHeight":1920,"everyNthFrame":1})
    rec["on"]=True
    pg.wait_for_selector(".sw-splash",timeout=10000)
    rwait(200); OFF[0]=frames[-1][1]-time.time()
    pg.wait_for_function("!document.querySelector('.sw-splash')",timeout=10000)
    mark("splash_end")
    pg.wait_for_selector("h1",timeout=15000)
    # ---------- S1 personnalisation ----------
    wait(700)
    tap(btn("Me localiser"),400)
    try: pg.wait_for_function("document.body.innerText.includes('Trouvé')",timeout=8000)
    except Exception: pass
    wait(900); cont(500)
    tap(btn("Vélo"),450); tap(btn("À pied"),700); cont(500)
    cont(400)
    tap(btn("Serré"),700); cont(500)
    for t in pg.locator("fieldset").all():
        tap(t.get_by_role("button",name=re.compile("Oui")),350)
    wait(500); cont(500)
    tap(btn("Restaurants"),400); tap(btn("Activités"),400); tap(btn("Grandes surfaces"),700); cont(500)
    tap(btn("Ciné"),400); tap(btn("Piscine"),700); cont(500)
    wait(1300)
    tap(pg.locator("div.fixed button.sw-btn-primary"),300)
    mark("onb_end")
    pg.wait_for_function("location.pathname==='/' && document.querySelectorAll('article').length>=3",timeout=15000)
    rwait(900)
    # (hors caméra) préchauffage : carte déjà chargée, position déjà connue
    nav("Recherche").click(); pg.wait_for_selector(".leaflet-marker-icon[title]",timeout=15000); rwait(1500)
    nav("Accueil").click(); pg.wait_for_function("document.querySelectorAll('article').length>=3",timeout=10000); rwait(800)
    btn("Plus proches").click()
    pg.wait_for_function("!document.body.innerText.includes('Recherche de ta position')",timeout=10000); rwait(1200)
    btn("Plus proches").click(); rwait(1200)
    pg.evaluate("window.scrollTo(0,0)"); rwait(600)
    # ---------- S2 accueil + recherche ----------
    mark("s2_start"); wait(1100)
    tap(btn("Plus proches"),1000)
    swipe_chips(190); wait(400)
    tap(btn("Restaurants"),1200)
    scroll(250); wait(800)
    tap(nav("Recherche"),900)
    pg.wait_for_selector(".leaflet-marker-icon[title]",timeout=15000)
    # ---- temps de carte : on laisse respirer, on dézoome, puis on revient sur soi ----
    wait(1400)
    tap(btn("Dézoomer"),1500)
    tap(btn("Revenir à ma localisation"),2400)
    tap(pg.locator('input[type="search"]'),300); typ("piscine"); pg.evaluate("document.activeElement.blur()"); wait(1800)
    tap(pg.locator("article button",has_text="Piscine"),1500)
    tap(pg.locator('[role="dialog"] button',has_text=re.compile("profit")),300)
    try: pg.wait_for_function("document.body.innerText.includes('Flèches')",timeout=6000)
    except Exception: pass
    rwait(1900)
    mark("s2_end")
    # (hors caméra) fermer la fiche, attendre la fin du toast, aller sur Partager
    pg.keyboard.press("Escape"); rwait(5200)
    if pg.locator('[role="dialog"]').count(): pg.locator('[role="dialog"] button[aria-label]').first.click(); rwait(500)
    nav("Partager").click(); pg.wait_for_selector("form",timeout=10000); rwait(900)
    # ---------- S3 partager ----------
    mark("s3_start")
    with pg.expect_file_chooser() as fc:
        tap(pg.locator("label",has_text="Prendre l'offre en photo"),300)
    fc.value.set_files(os.path.join(HERE,"affiche.jpg"))
    wait(800)
    try: pg.wait_for_function("document.body.innerText.includes('Vérifie les champs')",timeout=12000)
    except Exception: pass
    wait(700)
    scroll(250); wait(900)
    tap(pg.get_by_role("button",name=re.compile("Pizza Bruz")),1000)
    scroll(250); wait(1000)
    tap(pg.locator("form button",has_text="Publier le bon plan"),300)
    try: pg.wait_for_function("document.body.innerText.includes('bon plan publié')",timeout=10000)
    except Exception: pass
    rwait(1800)
    mark("s3_end")
    # (hors caméra) laisser le toast partir, aller au profil
    rwait(3000)
    nav("Ciblés").click(); rwait(2200); nav("Favoris") if False else None
    nav("Profil").click(); pg.wait_for_selector('section[aria-label="Mon impact"]',timeout=10000); rwait(1200)
    # ---------- S4 profil + récompenses ----------
    mark("s4_start")
    wait(1100)
    tap(pg.locator('section[aria-label="Mon impact"] button').first,1200)
    scroll(200); wait(1200)
    tap(nav("Ciblés"),900)
    tap(pg.get_by_role("tab",name=re.compile("Activité")) if pg.get_by_role("tab",name=re.compile("Activité")).count() else btn("Activité"),1200)
    scroll(300); wait(900)
    tap(pg.get_by_role("tab",name=re.compile("Récompenses")) if pg.get_by_role("tab",name=re.compile("Récompenses")).count() else btn("Récompenses"),1100)
    wait(800); scroll(320); wait(1100)
    tap(pg.get_by_role("button",name=re.compile("Échanger : Menu")),1100)
    tap(pg.get_by_role("button",name=re.compile("Confirmer pour")),2000)
    tap(pg.get_by_role("button",name=re.compile("Terminé")),900)
    scroll(-300); wait(1000)
    rwait(100); mark("s4_end")
    rec["on"]=False
    cdp.send("Page.stopScreencast")
    t0=frames[0][1]
    print("frames",len(frames),"erreurs",errs,"decalage",round(OFF[0],2))
    print({k:round(v-t0,1) for k,v in marks.items()})
    json.dump(frames,open(f"{OUT}/frames.json","w")); json.dump(marks,open(f"{OUT}/marks.json","w"))
    b.close()
