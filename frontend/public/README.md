# Favicon Instructions

## Current Favicon
The current favicon (`favicon.svg`) is a simplified SVG version of the brain graphic.

## To Replace with Your Processed Image

1. **Process your brain image** to remove the background:
   - Use online tools like [remove.bg](https://www.remove.bg/) or [Photopea](https://www.photopea.com/)
   - Or use image editing software like Photoshop, GIMP, or Canva

2. **Convert to favicon format**:
   - **Option 1: SVG** (recommended for scalability)
     - Save as `favicon.svg` in this folder
     - Ensure it has transparent background
   
   - **Option 2: PNG** (for better compatibility)
     - Create multiple sizes: 16x16, 32x32, 48x48, 192x192, 512x512
     - Save as `favicon-16x16.png`, `favicon-32x32.png`, etc.
     - Or use a favicon generator like [favicon.io](https://favicon.io/)

3. **Update `index.html`**:
   - If using SVG: Already configured as `/favicon.svg`
   - If using PNG: Update the link tag to:
     ```html
     <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
     <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
     ```

4. **For best results**, create a complete favicon package:
   - Use [RealFaviconGenerator](https://realfavicongenerator.net/) to generate all sizes
   - It will create all necessary files and provide the HTML code to update

## Image Requirements
- **Format**: SVG (preferred) or PNG
- **Background**: Transparent
- **Colors**: Purple/magenta (left) and cyan/teal (right) hemispheres
- **Size**: At least 512x512 pixels for high-quality rendering

