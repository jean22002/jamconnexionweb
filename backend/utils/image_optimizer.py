"""
Image Optimization Utility
Compresse et convertit les images en WebP automatiquement
"""
from PIL import Image
import io
import os
from pathlib import Path
from typing import Tuple, Optional

# Configuration
MAX_IMAGE_SIZE = (1920, 1920)  # Taille maximale
WEBP_QUALITY = 85  # Qualité WebP (80-90 recommandé)
JPEG_QUALITY = 85  # Qualité JPEG pour fallback
THUMBNAIL_SIZE = (400, 400)  # Taille des thumbnails


def optimize_image(
    image_path: str,
    output_path: Optional[str] = None,
    max_size: Tuple[int, int] = MAX_IMAGE_SIZE,
    quality: int = WEBP_QUALITY,
    convert_to_webp: bool = True
) -> dict:
    """
    Optimise une image : redimensionne, compresse, et convertit en WebP
    
    Args:
        image_path: Chemin de l'image source
        output_path: Chemin de sortie (None = écrase l'original)
        max_size: Taille maximale (width, height)
        quality: Qualité de compression (1-100)
        convert_to_webp: Convertir en WebP
        
    Returns:
        dict avec les infos de l'optimisation
    """
    try:
        # Ouvrir l'image
        with Image.open(image_path) as img:
            # Conserver les infos originales
            original_size = img.size
            original_format = img.format
            original_file_size = os.path.getsize(image_path)
            
            # Convertir en RGB si nécessaire (pour WebP)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Créer un fond blanc pour les images transparentes
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Redimensionner si nécessaire (en gardant le ratio)
            if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Déterminer le chemin de sortie
            if output_path is None:
                output_path = image_path
            
            # Convertir en WebP ou optimiser en JPEG
            if convert_to_webp:
                # Changer l'extension en .webp
                output_path = str(Path(output_path).with_suffix('.webp'))
                img.save(output_path, 'WEBP', quality=quality, method=6)
            else:
                # Optimiser en JPEG
                img.save(output_path, 'JPEG', quality=quality, optimize=True)
            
            # Récupérer la taille finale
            final_file_size = os.path.getsize(output_path)
            compression_ratio = (1 - final_file_size / original_file_size) * 100
            
            return {
                'success': True,
                'original_size': original_size,
                'final_size': img.size,
                'original_file_size': original_file_size,
                'final_file_size': final_file_size,
                'compression_ratio': round(compression_ratio, 2),
                'format': 'WebP' if convert_to_webp else 'JPEG',
                'output_path': output_path
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def create_thumbnail(
    image_path: str,
    thumbnail_path: str,
    size: Tuple[int, int] = THUMBNAIL_SIZE,
    quality: int = 80
) -> dict:
    """
    Crée une vignette optimisée d'une image
    
    Args:
        image_path: Chemin de l'image source
        thumbnail_path: Chemin de la vignette
        size: Taille de la vignette
        quality: Qualité
        
    Returns:
        dict avec les infos
    """
    try:
        with Image.open(image_path) as img:
            # Convertir en RGB
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Créer la vignette (crop au centre)
            img.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Sauvegarder en WebP
            thumbnail_path = str(Path(thumbnail_path).with_suffix('.webp'))
            img.save(thumbnail_path, 'WEBP', quality=quality, method=6)
            
            return {
                'success': True,
                'thumbnail_path': thumbnail_path,
                'size': img.size,
                'file_size': os.path.getsize(thumbnail_path)
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def optimize_uploaded_image(file_path: str) -> dict:
    """
    Optimise automatiquement une image uploadée
    Crée 3 versions : originale optimisée, thumbnail, et WebP
    
    Args:
        file_path: Chemin de l'image uploadée
        
    Returns:
        dict avec les chemins des différentes versions
    """
    base_path = Path(file_path)
    base_name = base_path.stem
    directory = base_path.parent
    
    # Chemins de sortie
    webp_path = directory / f"{base_name}.webp"
    thumbnail_path = directory / f"{base_name}_thumb.webp"
    
    # 1. Optimiser et convertir en WebP
    webp_result = optimize_image(
        str(file_path),
        str(webp_path),
        convert_to_webp=True
    )
    
    # 2. Créer une thumbnail
    thumb_result = create_thumbnail(
        str(file_path),
        str(thumbnail_path)
    )
    
    # 3. Optimiser l'original aussi (pour fallback)
    original_result = optimize_image(
        str(file_path),
        str(file_path),
        convert_to_webp=False,
        quality=JPEG_QUALITY
    )
    
    return {
        'original': {
            'path': str(file_path),
            'optimized': original_result.get('success', False),
            'size': original_result.get('final_file_size', 0)
        },
        'webp': {
            'path': str(webp_path) if webp_result.get('success') else None,
            'success': webp_result.get('success', False),
            'size': webp_result.get('final_file_size', 0),
            'compression': webp_result.get('compression_ratio', 0)
        },
        'thumbnail': {
            'path': str(thumbnail_path) if thumb_result.get('success') else None,
            'success': thumb_result.get('success', False),
            'size': thumb_result.get('file_size', 0)
        }
    }


def batch_optimize_directory(directory: str, recursive: bool = False) -> list:
    """
    Optimise toutes les images d'un dossier
    
    Args:
        directory: Chemin du dossier
        recursive: Rechercher dans les sous-dossiers
        
    Returns:
        Liste des résultats d'optimisation
    """
    results = []
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
    
    path = Path(directory)
    pattern = '**/*' if recursive else '*'
    
    for file_path in path.glob(pattern):
        if file_path.suffix.lower() in image_extensions:
            result = optimize_uploaded_image(str(file_path))
            results.append({
                'file': str(file_path),
                'result': result
            })
    
    return results
