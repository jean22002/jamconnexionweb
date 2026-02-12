#!/usr/bin/env python3
"""
Script pour optimiser toutes les images existantes dans /uploads
Convertit les images en WebP et crée des thumbnails
"""
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, '/app/backend')

from utils.image_optimizer import batch_optimize_directory

# Configuration
UPLOADS_DIR = Path('/app/backend/uploads')
FOLDERS = ['musicians', 'venues', 'melomanes', 'profiles']

def main():
    print("🎨 Image Optimization Script")
    print("=" * 50)
    
    total_processed = 0
    total_saved = 0
    
    for folder in FOLDERS:
        folder_path = UPLOADS_DIR / folder
        if not folder_path.exists():
            print(f"⚠️  Folder {folder} doesn't exist, skipping...")
            continue
        
        print(f"\n📁 Processing: {folder}/")
        results = batch_optimize_directory(str(folder_path), recursive=False)
        
        for result in results:
            file = result['file']
            data = result['result']
            
            if data['webp']['success']:
                original_size = data['original']['size']
                webp_size = data['webp']['size']
                savings = original_size - webp_size
                compression = data['webp']['compression']
                
                print(f"  ✅ {Path(file).name}")
                print(f"     {original_size:,} → {webp_size:,} bytes ({compression:.1f}% compression)")
                
                total_processed += 1
                total_saved += savings
            else:
                print(f"  ❌ Failed: {Path(file).name}")
    
    print("\n" + "=" * 50)
    print(f"📊 Summary:")
    print(f"   Images processed: {total_processed}")
    print(f"   Total space saved: {total_saved:,} bytes ({total_saved / 1024 / 1024:.2f} MB)")
    print(f"   Average compression: {(total_saved / (total_processed * 1024)) if total_processed > 0 else 0:.1f} KB per image")
    print("✅ Optimization complete!")

if __name__ == "__main__":
    main()
