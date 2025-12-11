# Adding Your IcePulse Logo

## Quick Setup

1. **Place your logo file** in the `public` folder with one of these names:
   - `logo.png` (recommended)
   - `logo.svg`
   - `logo.jpg` or `logo.jpeg`
   - `logo.webp`

2. **The Logo component will automatically detect and use it!**

## File Location

```
Ice-Pulse-Conneect/
  └── public/
      └── logo.png  ← Place your logo here
```

## Supported Formats

- **PNG** (recommended for logos with transparency)
- **SVG** (scalable vector graphics - best quality)
- **JPG/JPEG** (for photos)
- **WEBP** (modern format, smaller file size)

## Logo Sizing

The logo will automatically scale to the size specified:
- Login screen: 150px
- Other screens: 120px (default)
- You can customize the size by passing a `size` prop

## Example Usage

```tsx
<Logo size={150} />  // 150px logo
<Logo size={200} />  // 200px logo
<Logo />             // 120px (default)
```

## Troubleshooting

**Logo not showing?**
1. Make sure the file is in the `public` folder (not `public/images` or elsewhere)
2. Check the filename is exactly `logo.png` (or one of the supported formats)
3. Restart your dev server after adding the logo
4. Clear your browser cache

**Logo looks blurry?**
- Use SVG format for best quality at any size
- Or use a high-resolution PNG (at least 2x the display size)

## Current Status

The Logo component will:
- ✅ Automatically detect your logo file
- ✅ Fall back to text "IcePulse" if logo not found
- ✅ Support multiple image formats
- ✅ Scale properly to any size

