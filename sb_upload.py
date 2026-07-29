#!/usr/bin/env python3
# Pure-stdlib AWS SigV4 uploader for Supabase S3 storage. No deps.
import os, hashlib, hmac, datetime, urllib.request, urllib.parse
HOST="fmtuqieexvsmlqkdznbb.storage.supabase.co"; BASEPATH="/storage/v1/s3"
REF="fmtuqieexvsmlqkdznbb"; REGION="us-west-1"; SERVICE="s3"
KEY=os.environ["SB_KEY"]; SECRET=os.environ["SB_SECRET"]

def sha(b): return hashlib.sha256(b).hexdigest()
def hm(k,m): return hmac.new(k,m.encode(),hashlib.sha256).digest()
def signing_key(date):
    k=hm(("AWS4"+SECRET).encode(),date); k=hm(k,REGION); k=hm(k,SERVICE); return hm(k,"aws4_request")

def req(method, path, body=b"", ctype=None):
    t=datetime.datetime.utcnow(); amz=t.strftime("%Y%m%dT%H%M%SZ"); ds=t.strftime("%Y%m%d")
    cpath=BASEPATH+path  # path already starts with /
    canon_uri=urllib.parse.quote(cpath, safe="/")
    ph=sha(body)
    hdrs={"host":HOST,"x-amz-content-sha256":ph,"x-amz-date":amz}
    if ctype: hdrs["content-type"]=ctype
    signed=";".join(sorted(hdrs))
    canon_hdrs="".join(f"{k}:{hdrs[k]}\n" for k in sorted(hdrs))
    creq=f"{method}\n{canon_uri}\n\n{canon_hdrs}\n{signed}\n{ph}"
    scope=f"{ds}/{REGION}/{SERVICE}/aws4_request"
    sts=f"AWS4-HMAC-SHA256\n{amz}\n{scope}\n{sha(creq.encode())}"
    sig=hmac.new(signing_key(ds),sts.encode(),hashlib.sha256).hexdigest()
    auth=f"AWS4-HMAC-SHA256 Credential={KEY}/{scope}, SignedHeaders={signed}, Signature={sig}"
    url=f"https://{HOST}{cpath}"
    r=urllib.request.Request(url,data=body if method in("PUT","POST") else None,method=method)
    for k,v in hdrs.items():
        if k!="host": r.add_header(k,v)
    r.add_header("Authorization",auth)
    try:
        with urllib.request.urlopen(r,timeout=30) as resp: return resp.getcode(),resp.read()
    except urllib.error.HTTPError as e: return e.code, e.read()

# list buckets
code,body=req("GET","/")
import re
buckets=re.findall(r"<Name>([^<]+)</Name>", body.decode("utf-8","ignore"))
print("list buckets:",code,buckets)
BUCKET=None
for p in ["public","images","assets","email-assets","media"]:
    if p in buckets: BUCKET=p; break
if not BUCKET and buckets: BUCKET=buckets[0]
if not BUCKET:
    c,b=req("PUT","/email-assets"); print("create bucket:",c); BUCKET="email-assets"
print("using bucket:",BUCKET)

R="/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client/email_campaigns"
IMGS={"a1-sauna-hero.jpg":R+"/dialed_labs_airbnb/images/a1-sauna-hero.jpg",
 "a2-january-calendar.jpg":R+"/dialed_labs_airbnb/images/a2-january-calendar.jpg",
 "a4-airbnb-search.jpg":R+"/dialed_labs_airbnb/images/a4-airbnb-search.jpg",
 "a5-instagram.jpg":R+"/dialed_labs_airbnb/images/a5-instagram.jpg",
 "dialed-logo-onblack.png":R+"/dialed_labs_airbnb/images/dialed-logo-onblack.png",
 "px-black.png":R+"/dialed_labs_airbnb/images/px-black.png",
 "btn-women.png":R+"/dialed_labs_airbnb/images/btn-women.png",
 "btn-winter.png":R+"/dialed_labs_airbnb/images/btn-winter.png",
 "btn-wellness.png":R+"/dialed_labs_airbnb/images/btn-wellness.png",
 "btn-standout.png":R+"/dialed_labs_airbnb/images/btn-standout.png",
 "btn-social.png":R+"/dialed_labs_airbnb/images/btn-social.png",
 "e6-install.jpg":R+"/dialed_labs_airbnb/images/e6-install.jpg",
 "e6-install2.jpg":R+"/dialed_labs_airbnb/images/e6-install2.jpg",
 "e6-sauna.jpg":R+"/dialed_labs_airbnb/images/e6-sauna.jpg",
 "e6-chart.png":R+"/dialed_labs_airbnb/images/e6-chart.png",
 "e6-btn.png":R+"/dialed_labs_airbnb/images/e6-btn.png",
 "px-gold.png":R+"/dialed_labs_airbnb/images/px-gold.png",
 "dialed-sig.png":R+"/dialed_labs_airbnb/images/dialed-sig.png",
 "dialed-sig2.png":R+"/dialed_labs_airbnb/images/dialed-sig2.png",
 "dialed-sig3.png":R+"/dialed_labs_airbnb/images/dialed-sig3.png",
 "phone-icon.png":R+"/dialed_labs_airbnb/images/phone-icon.png",
 "nh-header.png":R+"/noble_harbor_wholesale/images/nh-header.png",
 "vial-card-white.png":R+"/noble_harbor_wholesale/images/vial-card-white.png"}
pub=f"https://{REF}.supabase.co/storage/v1/object/public/{BUCKET}/email/"
lines=[]
for name,path in IMGS.items():
    ct="image/png" if name.endswith("png") else "image/jpeg"
    c,b=req("PUT",f"/{BUCKET}/email/{name}",open(path,"rb").read(),ct)
    print("upload",name,"->",c, "" if c<300 else b[:120])
    lines.append(f"{name} {pub}{name}")
open("/tmp/imgmap.txt","w").write("\n".join(lines))
# public test
try:
    code=urllib.request.urlopen(pub+"nh-logo.png",timeout=15).getcode()
    print("PUBLIC TEST nh-logo.png ->",code)
except Exception as e: print("PUBLIC TEST FAILED (make bucket public in Supabase):",e)
print("\n".join(lines))
