#!/bin/bash

# Simple script to generate SVG icons of different sizes

for size in 16 48 128; do
  cat > "icon${size}.svg" << EOF
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#065fd4"/>
  <text x="50%" y="50%" font-family="Arial" font-size="$((size/2))" fill="white" text-anchor="middle" dominant-baseline="middle">YS</text>
</svg>
EOF

  # Convert to PNG using browser or other tools if available
  # This is a placeholder - you'll need a real conversion tool
  echo "Created icon${size}.svg"
  # For a quick solution, copy this SVG to icon.png
  if [ "$size" = "48" ]; then
    cp "icon${size}.svg" "icon${size}.png"
  fi
done

# Create symlinks for the required icon sizes that point to the one we have
ln -sf icon48.png icon16.png
ln -sf icon48.png icon128.png

echo "Icons created. Note: These are placeholders. Replace with real PNG icons for production use."