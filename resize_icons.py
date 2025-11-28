from PIL import Image
import os
import sys

def resize_icon(input_path, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    try:
        img = Image.open(input_path)
        sizes = [16, 32, 48, 128]
        
        for size in sizes:
            resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
            output_path = os.path.join(output_dir, f"icon-{size}.png")
            resized_img.save(output_path, "PNG")
            print(f"Saved {output_path}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python resize_icons.py <input_image> <output_dir>")
    else:
        resize_icon(sys.argv[1], sys.argv[2])
