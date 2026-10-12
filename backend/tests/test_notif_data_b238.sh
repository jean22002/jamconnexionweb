#!/bin/bash
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2)
login(){ curl -s -X POST "$API/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$1\",\"password\":\"test\"}" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])"; }
VT=$(login bar@gmail.com); MT=$(login test@gmail.com); P=ad9f5a51-ff6f-4e78-9bb3-1957d4dcdad1
HV="Authorization: Bearer $VT"; HM="Authorization: Bearer $MT"; J="Content-Type: application/json"
mk(){ curl -s -X POST "$API/api/planning" -H "$HV" -H "$J" -d "{\"date\":\"$1\",\"time\":\"21:00\",\"title\":\"B238\",\"accepts_plateaus\":true,\"num_bands_needed\":3}" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])"; }
S1=$(mk 2027-07-03); S2=$(mk 2027-07-04)
A1=$(curl -s -X POST "$API/api/applications" -H "$HM" -H "$J" -d "{\"planning_slot_id\":\"$S1\"}" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
A2=$(curl -s -X POST "$API/api/applications" -H "$HM" -H "$J" -d "{\"planning_slot_id\":\"$S2\"}" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
A3=$(curl -s -X POST "$API/api/applications" -H "$HM" -H "$J" -d "{\"planning_slot_id\":\"$S2\",\"plateau_id\":\"$P\"}" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
curl -s -o /dev/null -X POST "$API/api/applications/$A1/accept" -H "$HV"
curl -s -o /dev/null -X POST "$API/api/applications/$A1/cancel" -H "$HM" -H "$J" -d '{"reason":"test"}'
curl -s -X POST "$API/api/applications/$A1/cancellation/validate" -H "$HV" -H "$J" -d '{"approve":false,"message":"non"}' >/dev/null
curl -s -o /dev/null -X POST "$API/api/applications/$A1/cancel" -H "$HM" -H "$J" -d '{"reason":"test2"}'
curl -s -X POST "$API/api/applications/$A1/cancellation/validate" -H "$HV" -H "$J" -d '{"approve":true}' >/dev/null
curl -s -o /dev/null -X POST "$API/api/applications/$A2/reject" -H "$HV"
curl -s -o /dev/null -X POST "$API/api/applications/$A3/accept" -H "$HV"
cd /app/backend && python3 -c "
import os;from pymongo import MongoClient;from dotenv import load_dotenv;load_dotenv('.env')
db=MongoClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
ids=['$A1','$A2','$A3']
for n in db.notifications.find({'data.application_id':{'\$in':ids}},{'_id':0,'type':1,'data':1}).sort('created_at',1):
    d=n['data']; print(n['type'].ljust(24), d.get('application_id')[:8], d.get('planning_slot_id','')[:8], d.get('date'), d.get('venue_id'), (d.get('plateau_id') or '')[:8])
print('null-data:', [n['type'] for n in db.notifications.find({'message':{'\$regex':'2027-07-0[34]'},'data':None})])
db.musicians.update_many({},{'\$pull':{'concerts':{'id':{'\$in':[i+'_concert' for i in ids]}},'upcoming_concerts':{'id':{'\$in':[i+'_concert' for i in ids]}}}})
db.concerts.delete_many({'id':{'\$in':[i+'_concert' for i in ids]}}); db.applications.delete_many({'id':{'\$in':ids}})
db.planning_slots.delete_many({'id':{'\$in':['$S1','$S2']}}); db.notifications.delete_many({'\$or':[{'data.application_id':{'\$in':ids}},{'message':{'\$regex':'2027-07-0[34]'}}]})
print('cleaned')"
