#!/bin/bash
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2)
login(){ curl -s -X POST "$API/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$1\",\"password\":\"test\"}" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])"; }
VT=$(login bar@gmail.com); MT=$(login test@gmail.com)
HV="Authorization: Bearer $VT"; HM="Authorization: Bearer $MT"; J="Content-Type: application/json"
q(){ cd /app/backend && python3 -c "
import os;from pymongo import MongoClient;from dotenv import load_dotenv;load_dotenv('.env')
db=MongoClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
$1"; }
SID=$(curl -s -X POST "$API/api/planning" -H "$HV" -H "$J" -d '{"date":"2027-08-14","time":"21:00","title":"B239 test","music_styles":["Rock"],"has_catering":true}' | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
AID=$(curl -s -X POST "$API/api/applications" -H "$HM" -H "$J" -d "{\"planning_slot_id\":\"$SID\"}" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
C="${AID}_concert"
curl -s -o /dev/null -X POST "$API/api/applications/$AID/accept" -H "$HV"
curl -s "$API/api/concerts/$C" | python3 -c "import sys,json;d=json.load(sys.stdin);print('1 accept ->',d.get('id')==\"$C\",d.get('status'),d.get('bands'),d.get('application_id')==\"$AID\")"
q "print('  planning copy', db.musicians.count_documents({'concerts.id':'$C'}))"
curl -s -o /dev/null -X DELETE "$API/api/concerts/$C" -H "$HV"
curl -s -o /dev/null -w "2 after delete GET -> %{http_code}\n" "$API/api/concerts/$C"
curl -s -o /dev/null -X POST "$API/api/applications/$AID/accept" -H "$HV"
curl -s -o /dev/null -w "3 re-accept (already accepted) GET -> %{http_code}\n" "$API/api/concerts/$C"
q "print('  planning copy', db.musicians.count_documents({'concerts.id':'$C'}))"
curl -s -X POST "$API/api/concerts" -H "$HV" -H "$J" -d "{\"date\":\"2027-08-14\",\"start_time\":\"21:00\",\"application_id\":\"$AID\",\"bands\":[{\"name\":\"x\"}]}" | python3 -c "import sys,json;print('4 POST with application_id (exists) -> id', json.load(sys.stdin).get('id')==\"$C\")"
q "print('  concerts for app', db.concerts.count_documents({'\$or':[{'id':'$C'},{'application_id':'$AID'}]}))"
curl -s -o /dev/null -X DELETE "$API/api/concerts/$C" -H "$HV"
curl -s -X POST "$API/api/concerts" -H "$HV" -H "$J" -d "{\"date\":\"2027-08-14\",\"start_time\":\"21:00\",\"application_id\":\"$AID\",\"bands\":[{\"name\":\"x\"}]}" | python3 -c "import sys,json;d=json.load(sys.stdin);print('5 POST with application_id (missing) -> id', d.get('id')==\"$C\", d.get('application_id')==\"$AID\")"
curl -s -o /dev/null -w "6 POST unknown application_id -> %{http_code}\n" -X POST "$API/api/concerts" -H "$HV" -H "$J" -d '{"date":"2027-08-14","start_time":"21:00","application_id":"nope"}'
curl -s -w " 7 DELETE slot with accepted app -> %{http_code}\n" -X DELETE "$API/api/planning/$SID" -H "$HV"
q "print('8 backfill dedupe (slot deleted -> skip)'); 
db.musicians.update_many({},{'\$pull':{'concerts':{'id':'$C'},'upcoming_concerts':{'id':'$C'}}})
db.concerts.delete_many({'\$or':[{'id':'$C'},{'application_id':'$AID'}]}); db.applications.delete_many({'id':'$AID'}); db.planning_slots.delete_many({'id':'$SID'})
db.notifications.delete_many({'\$or':[{'data.application_id':'$AID'},{'message':{'\$regex':'2027-08-14'}}]}); print('cleaned')"
