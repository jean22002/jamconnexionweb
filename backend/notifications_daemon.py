#!/usr/bin/env python3
"""
Daemon pour le système de notifications automatiques
S'exécute en continu et lance le script de notifications à 12h30 chaque jour
"""

import asyncio
import time
from datetime import datetime
import pytz
import subprocess
import os
import sys

# Force unbuffered output
sys.stdout = os.fdopen(sys.stdout.fileno(), 'w', 1)
sys.stderr = os.fdopen(sys.stderr.fileno(), 'w', 1)

PARIS_TZ = pytz.timezone('Europe/Paris')
TARGET_HOUR = 12
TARGET_MINUTE = 30

async def run_notifications_script():
    """Execute le script de notifications"""
    script_path = os.path.join(os.path.dirname(__file__), 'notifications_scheduler.py')
    
    try:
        print(f"\n{'='*60}")
        print(f"🔔 Lancement du script de notifications...")
        print(f"{'='*60}\n")
        
        result = subprocess.run(
            ['python3', script_path],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        if result.returncode == 0:
            print("✅ Script exécuté avec succès")
        else:
            print(f"❌ Erreur d'exécution (code {result.returncode})")
            
    except Exception as e:
        print(f"❌ Erreur lors de l'exécution: {e}")

async def main():
    """Boucle principale du daemon"""
    print("🚀 Démarrage du daemon de notifications")
    print(f"⏰ Planification: tous les jours à {TARGET_HOUR:02d}:{TARGET_MINUTE:02d} (Paris)\n")
    
    last_run_date = None
    
    while True:
        try:
            now_paris = datetime.now(PARIS_TZ)
            current_date = now_paris.date()
            current_hour = now_paris.hour
            current_minute = now_paris.minute
            
            # Vérifier si c'est l'heure d'exécution et si on ne l'a pas déjà fait aujourd'hui
            if (current_hour == TARGET_HOUR and 
                current_minute == TARGET_MINUTE and 
                last_run_date != current_date):
                
                print(f"\n⏰ {now_paris.strftime('%Y-%m-%d %H:%M:%S')} - C'est l'heure !")
                await run_notifications_script()
                last_run_date = current_date
                
                # Attendre une minute pour éviter les exécutions multiples
                await asyncio.sleep(60)
            else:
                # Vérifier toutes les 30 secondes
                await asyncio.sleep(30)
                
        except KeyboardInterrupt:
            print("\n🛑 Arrêt du daemon")
            break
        except Exception as e:
            print(f"❌ Erreur dans la boucle principale: {e}")
            await asyncio.sleep(60)

if __name__ == "__main__":
    asyncio.run(main())
