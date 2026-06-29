try:
    from PIL import Image
    print("Pillow available")
except Exception as e:
    print("Pillow not available:", e)
