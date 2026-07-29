#!/usr/bin/env python3
import os, boto3, urllib.request
EP="https://fmtuqieexvsmlqkdznbb.storage.supabase.co/storage/v1/s3"
REF="fmtuqieexvsmlqkdznbb"
s3=boto3.client("s3", endpoint_url=EP, region_name="us-west-1",
    aws_access_key_id=os.environ["SB_KEY"], aws_secret_access_key=os.environ["SB_SECRET"])
buckets=[b["Name"] for b in s3.list_buckets().get("Buckets",[])]
print("buckets:", buckets)
BUCKET=None
for p in ["public","images","assets","email-assets","media","email"]:
    if p in buckets: BUCKET=p; break
if not BUCKET and buckets: BUCKET=buckets[0]
if not BUCKET:
    s3.create_bucket(Bucket="email-assets"); BUCKET="email-assets"
print("using bucket:", BUCKET)
R="/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client/email_campaigns"
IMGS={
 "a1-sauna-hero.jpg":R+"/dialed_labs_airbnb/images/a1-sauna-hero.jpg",
 "a2-january-calendar.jpg":R+"/dialed_labs_airbnb/images/a2-january-calendar.jpg",
 "a4-airbnb-search.jpg":R+"/dialed_labs_airbnb/images/a4-airbnb-search.jpg",
 "a5-instagram.jpg":R+"/dialed_labs_airbnb/images/a5-instagram.jpg",
 "dialed-logo.png":R+"/dialed_labs_airbnb/images/dialed-logo.png",
 "nh-logo.png":R+"/noble_harbor_wholesale/images/nh-logo.png",
 "vial-your-brand.png":R+"/noble_harbor_wholesale/images/vial-your-brand.png",
}
base=f"https://{REF}.supabase.co/storage/v1/object/public/{BUCKET}/email/"
lines=[]
for name,path in IMGS.items():
    ct="image/png" if name.endswith("png") else "image/jpeg"
    s3.upload_file(path, BUCKET, "email/"+name, ExtraArgs={"ContentType":ct,"CacheControl":"public, max-age=31536000"})
    url=base+name; lines.append(f"{name} {url}"); print("uploaded:", url)
open("/tmp/imgmap.txt","w").write("\n".join(lines))
# test public access on one
try:
    u=base+"nh-logo.png"; code=urllib.request.urlopen(u, timeout=15).getcode()
    print("PUBLIC ACCESS TEST:", u, "->", code)
except Exception as e:
    print("PUBLIC ACCESS TEST FAILED (bucket likely private):", e)
