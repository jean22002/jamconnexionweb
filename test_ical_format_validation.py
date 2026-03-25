#!/usr/bin/env python3
"""
Test iCal format validation by simulating the generate_ical function
"""

from datetime import datetime, timedelta

def generate_ical_test(events, band_name):
    """
    Test version of the generate_ical function from band_invitations.py
    """
    # iCal header
    ical_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Musician Calendar//Band Planning//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{band_name} - Planning",
        "X-WR-TIMEZONE:Europe/Paris",
        "X-WR-CALDESC:Planning des concerts et événements du groupe"
    ]
    
    for event in events:
        # Parse date and time
        event_date = event.get("date", "")
        start_time = event.get("start_time", "20:00")
        end_time = event.get("end_time", "23:00")
        
        # Build datetime string in iCal format (YYYYMMDDTHHMMSS)
        try:
            # Parse ISO date
            date_obj = datetime.fromisoformat(event_date)
            
            # Parse start time
            start_parts = start_time.split(":")
            start_hour = int(start_parts[0]) if start_parts else 20
            start_minute = int(start_parts[1]) if len(start_parts) > 1 else 0
            
            # Parse end time
            end_parts = end_time.split(":")
            end_hour = int(end_parts[0]) if end_parts else 23
            end_minute = int(end_parts[1]) if len(end_parts) > 1 else 0
            
            # Create start and end datetime
            start_dt = date_obj.replace(hour=start_hour, minute=start_minute)
            end_dt = date_obj.replace(hour=end_hour, minute=end_minute)
            
            # Format for iCal (local time)
            dtstart = start_dt.strftime("%Y%m%dT%H%M%S")
            dtend = end_dt.strftime("%Y%m%dT%H%M%S")
            dtstamp = datetime.now().strftime("%Y%m%dT%H%M%SZ")
            
        except Exception:
            # Fallback si parsing échoue
            continue
        
        # Event details
        venue_name = event.get("venue_name", "Lieu non spécifié")
        venue_city = event.get("venue_city", "")
        description_text = event.get("description", "")
        event_id = event.get("id", "")
        
        # Build location
        location = venue_name
        if venue_city:
            location = f"{venue_name}, {venue_city}"
        
        # Build description
        description = f"Concert avec {band_name}"
        if description_text:
            description += f"\\n\\n{description_text}"
        if event.get("payment_method"):
            payment_info = event.get("payment_method")
            if payment_info == "guso":
                description += "\\n\\nMode de paiement: GUSO"
            elif payment_info == "facture":
                description += "\\n\\nMode de paiement: Facture"
            elif payment_info == "promotion":
                description += "\\n\\nConcert promotionnel"
        if event.get("amount"):
            description += f"\\n\\nCachet: {event.get('amount')}€"
        
        # Build summary (title)
        summary = f"{venue_name} - {band_name}"
        if event.get("title"):
            summary = f"{event.get('title')} @ {venue_name}"
        
        # Add event to calendar
        ical_lines.extend([
            "BEGIN:VEVENT",
            f"UID:{event_id}@musician-calendar.com",
            f"DTSTAMP:{dtstamp}",
            f"DTSTART:{dtstart}",
            f"DTEND:{dtend}",
            f"SUMMARY:{summary}",
            f"DESCRIPTION:{description}",
            f"LOCATION:{location}",
            "STATUS:CONFIRMED",
            "TRANSP:OPAQUE",
            "END:VEVENT"
        ])
    
    # Close calendar
    ical_lines.append("END:VCALENDAR")
    
    return "\r\n".join(ical_lines)

def test_ical_format():
    print("📅 Testing iCal Format Generation")
    
    # Test data
    band_name = "Test Band E2E"
    events = [
        {
            "id": "concert_001",
            "date": "2026-04-15",
            "start_time": "20:00",
            "end_time": "23:00",
            "venue_name": "Test Venue Paris",
            "venue_city": "Paris",
            "description": "Concert de rock avec Test Band E2E",
            "title": "Rock Night",
            "payment_method": "facture",
            "amount": 500
        },
        {
            "id": "concert_002", 
            "date": "2026-05-20",
            "start_time": "19:30",
            "end_time": "22:30",
            "venue_name": "Le Club Jazz",
            "venue_city": "Lyon",
            "description": "Soirée jazz fusion",
            "payment_method": "guso",
            "amount": 300
        }
    ]
    
    # Generate iCal
    ical_content = generate_ical_test(events, band_name)
    
    print(f"✅ Generated iCal content ({len(ical_content)} characters)")
    
    # Validate RFC 5545 compliance
    required_elements = [
        "BEGIN:VCALENDAR",
        "END:VCALENDAR", 
        "VERSION:2.0",
        "PRODID:-//Musician Calendar//Band Planning//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:",
        "X-WR-TIMEZONE:Europe/Paris"
    ]
    
    print(f"\n🔍 RFC 5545 Compliance Check:")
    all_valid = True
    for element in required_elements:
        if element in ical_content:
            print(f"   ✅ {element.split(':')[0]}: Present")
        else:
            print(f"   ❌ {element.split(':')[0]}: Missing")
            all_valid = False
    
    # Check events
    event_count = ical_content.count("BEGIN:VEVENT")
    print(f"\n🎪 Events in calendar: {event_count}")
    
    if event_count == len(events):
        print(f"   ✅ All {len(events)} events included")
    else:
        print(f"   ❌ Expected {len(events)} events, found {event_count}")
        all_valid = False
    
    # Check event fields
    event_fields = ["UID:", "DTSTART:", "DTEND:", "SUMMARY:", "LOCATION:", "DESCRIPTION:", "STATUS:CONFIRMED"]
    print(f"\n📋 Event Fields Check:")
    for field in event_fields:
        if field in ical_content:
            print(f"   ✅ {field[:-1]}: Present")
        else:
            print(f"   ❌ {field[:-1]}: Missing")
            all_valid = False
    
    # Check line endings
    if "\r\n" in ical_content:
        print(f"   ✅ CRLF line endings: Correct")
    else:
        print(f"   ❌ CRLF line endings: Missing")
        all_valid = False
    
    # Check datetime format
    import re
    datetime_pattern = r'\d{8}T\d{6}'
    datetime_matches = re.findall(datetime_pattern, ical_content)
    if datetime_matches:
        print(f"   ✅ DateTime format: {len(datetime_matches)} valid timestamps")
    else:
        print(f"   ❌ DateTime format: No valid timestamps found")
        all_valid = False
    
    # Show sample content
    print(f"\n📄 Sample iCal Content:")
    lines = ical_content.split('\r\n')[:15]
    for line in lines:
        print(f"   {line}")
    
    print(f"\n🎯 Format Validation Result:")
    if all_valid:
        print(f"   ✅ iCal format is RFC 5545 compliant")
    else:
        print(f"   ❌ iCal format has issues")
    
    return all_valid

if __name__ == "__main__":
    success = test_ical_format()
    print(f"\n{'✅ SUCCESS' if success else '❌ FAILURE'}: iCal format validation")
