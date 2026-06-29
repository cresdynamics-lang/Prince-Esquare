import os
import json
from pathlib import Path
from PIL import Image
import pillow_heif

# Register HEIC opener
pillow_heif.register_heif_opener()

SOURCE_DIR = r'c:\Users\Spine\Downloads'
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'processed-images')

IMAGES = [
    'IMG_3707.HEIC', 'IMG_3710.HEIC', 'IMG_3714.HEIC',
    'IMG_4052.HEIC', 'IMG_4053.HEIC', 'IMG_4054.HEIC', 'IMG_4055.HEIC',
    'IMG_4056.HEIC', 'IMG_4057.HEIC', 'IMG_4064.HEIC', 'IMG_4065.HEIC',
    'IMG_4066.HEIC', 'IMG_4067.HEIC', 'IMG_4068.HEIC', 'IMG_4069.HEIC',
    'IMG_4070.HEIC', 'IMG_4071.HEIC', 'IMG_4072.HEIC', 'IMG_4073.HEIC',
    'IMG_4076.HEIC', 'IMG_4077.HEIC', 'IMG_4080.HEIC', 'IMG_4081.HEIC',
    'IMG_4082.HEIC', 'IMG_4085.HEIC', 'IMG_4086.HEIC', 'IMG_4089.HEIC',
    'IMG_4090.HEIC', 'IMG_4091.HEIC', 'IMG_4094.HEIC', 'IMG_4099.HEIC',
    'IMG_4102.HEIC', 'IMG_4103.HEIC', 'IMG_4106.HEIC', 'IMG_4265.HEIC',
    'IMG_4282.HEIC', 'IMG_4283.HEIC', 'IMG_4049.HEIC', 'IMG_4051.HEIC'
]

# Create output directory
os.makedirs(OUTPUT_DIR, exist_ok=True)

def convert_heic_to_jpeg(heic_path, output_path):
    try:
        # Open HEIC image
        img = Image.open(heic_path)
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize and save as JPEG with compression
        img.thumbnail((800, 800), Image.Resampling.LANCZOS)
        img.save(output_path, 'JPEG', quality=80, optimize=True)
        
        print(f"✓ Converted: {os.path.basename(heic_path)} → {os.path.basename(output_path)}")
        return output_path
    except Exception as e:
        print(f"✗ Error converting {heic_path}: {str(e)}")
        return None

def process_all_images():
    print("Starting image conversion...\n")
    
    results = []
    
    for image in IMAGES:
        heic_path = os.path.join(SOURCE_DIR, image)
        jpeg_name = image.replace('.HEIC', '.jpg')
        output_path = os.path.join(OUTPUT_DIR, jpeg_name)
        
        if os.path.exists(heic_path):
            result = convert_heic_to_jpeg(heic_path, output_path)
            if result:
                results.append({
                    'original': image,
                    'converted': jpeg_name,
                    'path': output_path
                })
        else:
            print(f"⚠ File not found: {heic_path}")
    
    print(f"\n✓ Successfully converted {len(results)}/{len(IMAGES)} images")
    print(f"\nOutput directory: {OUTPUT_DIR}")
    
    # Save results to JSON for next step
    with open(os.path.join(os.path.dirname(__file__), 'converted-images.json'), 'w') as f:
        json.dump(results, f, indent=2)
    
    return results

if __name__ == '__main__':
    process_all_images()
    print("\n✓ Conversion complete!")
