#!/bin/bash
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2)
login(){ curl -s -X POST "$API/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$1\",\"password\":\"test\"}" | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])"; }
VT=$(login bar@gmail.com); MT=$(login test@gmail.com); P=ad9f5a51-ff6f-4e78-9bb3-1957d4dcdad1
HV="Authorization: Bearer $VT"; HM="Authorization: Bearer $MT"; J="Content-Type: application/json"
q(){ cd /app/backend && python3 -c "
import os;from pymongo import MongoClient;from dotenv import load_dotenv;load_dotenv('.env')
db=MongoClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
$1"; }
SID=$(curl -s -X POST "$API/api/planning" -H "$HV" -H "$J" -d '{"date":"2027-05-22","time":"21:00","title":"B237 test","accepts_plateaus":true}' | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
AID=$(curl -s -X POST "$API/api/applications" -H "$HM" -H "$J" -d "{\"planning_slot_id\":\"$SID\",\"plateau_id\":\"$P\"}" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
echo "slot=$SID app=$AID"
echo "--- plateau applications"; curl -s "$API/api/plateaus/$P/applications" -H "$HM" | python3 -c "import sys,json;d=json.load(sys.stdin);print([(a['status'],a['slot'] and (a['slot']['venue_name'],a['slot']['venue_city'],a['slot']['date'])) for a in d if a['id']=='$AID'])"
curl -s -o /dev/null -w "venue on applications -> %{http_code}\n" "$API/api/plateaus/$P/applications" -H "$HV"
curl -s -o /dev/null -w "venue on concerts before booking -> %{http_code}\n" "$API/api/plateaus/$P/concerts" -H "$HV"
echo "--- accept"; curl -s -X POST "$API/api/applications/$AID/accept" -H "$HV"; echo
CID="${AID}_concert"
q "print('concert plateau', db.concerts.find_one({'id':'$CID'},{'_id':0,'plateau_id':1,'plateau_title':1}))
print('notif admin', [(n['type'],n['data'].get('status'),n['data'].get('plateau_id')[:8]) for n in db.notifications.find({'data.application_id':'$AID'})])
print('booked notifs (expect 0)', db.notifications.count_documents({'type':'plateau_concert_booked','data.concert_id':'$CID'}))
print('copies', db.musicians.count_documents({'concerts.id':'$CID'}))"
echo "--- concerts member/venue"; curl -s "$API/api/plateaus/$P/concerts?upcoming=true" -H "$HM" | python3 -c "import sys,json;print([c for c in json.load(sys.stdin) if c['id']=='$CID'])"
curl -s "$API/api/plateaus/$P/concerts?upcoming=true" -H "$HV" | python3 -c "import sys,json;print('venue sees', len(json.load(sys.stdin)))"
curl -s "$API/api/concerts/$CID" | python3 -c "import sys,json;d=json.load(sys.stdin);print('GET concert', d.get('plateau_title'), d.get('date'))"
curl -s -o /dev/null -w "GET concert 404 -> %{http_code}\n" "$API/api/concerts/nope"
echo "--- reset"; curl -s -X PATCH "$API/api/applications/$AID" -H "$HV" -H "$J" -d '{"status":"pending"}'; echo
q "print('copies after reset', db.musicians.count_documents({'\$or':[{'concerts.id':'$CID'},{'upcoming_concerts.id':'$CID'}]}))"
curl -s -o /dev/null -X POST "$API/api/applications/$AID/accept" -H "$HV"
q "print('copies after re-accept', db.musicians.count_documents({'concerts.id':'$CID'}))"
echo "--- delete concert"; curl -s -X DELETE "$API/api/concerts/$CID" -H "$HV"; echo
q "print('copies after delete', db.musicians.count_documents({'\$or':[{'concerts.id':'$CID'},{'upcoming_concerts.id':'$CID'}]}))"
echo "--- reject"; curl -s -X PATCH "$API/api/applications/$AID" -H "$HV" -H "$J" -d '{"status":"pending"}' >/dev/null; curl -s -X POST "$API/api/applications/$AID/reject" -H "$HV"; echo
q "print('reject notif', [n['data'].get('status') for n in db.notifications.find({'data.application_id':'$AID','type':'application_response'})])
db.applications.delete_many({'id':'$AID'}); db.planning_slots.delete_one({'id':'$SID'}); db.concerts.delete_many({'id':'$CID'})
db.notifications.delete_many({'data.application_id':'$AID'}); db.notifications.delete_many({'message':{'\$regex':'2027-05-22'}})
print('cleaned')"
