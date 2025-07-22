#!/bin/bash
# MySeedBook Catalogue - Build and Test Script (Bash version)
# For macOS/Linux users

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Default values
BUILD_TYPE="preview"
PLATFORM="android"
ICON_TEST=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --build-type)
      BUILD_TYPE="$2"
      shift 2
      ;;
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    --icon-test)
      ICON_TEST=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--build-type preview|production|development|web] [--platform android|ios|all] [--icon-test]"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}🌱 MySeedBook Catalogue Build Script${NC}"
echo -e "${GREEN}=====================================${NC}"

# Check if EAS CLI is installed
if command -v eas &> /dev/null; then
    EAS_VERSION=$(eas --version)
    echo -e "${GREEN}✅ EAS CLI found: $EAS_VERSION${NC}"
else
    echo -e "${RED}❌ EAS CLI not found. Installing...${NC}"
    npm install -g @expo/eas-cli
fi

# Check if logged in to EAS
echo -e "\n${CYAN}🔐 Checking EAS authentication...${NC}"
if eas whoami &> /dev/null; then
    WHOAMI=$(eas whoami)
    echo -e "${GREEN}✅ Logged in as: $WHOAMI${NC}"
else
    echo -e "${RED}❌ Not logged in to EAS. Please run: eas login${NC}"
    exit 1
fi

# Icon validation
if [ "$ICON_TEST" = true ]; then
    echo -e "\n${CYAN}🎨 Validating app icon...${NC}"
    ICON_PATH="assets/images/icon.png"
    
    if [ -f "$ICON_PATH" ]; then
        ICON_SIZE=$(wc -c < "$ICON_PATH")
        echo -e "${GREEN}✅ Icon found: $ICON_PATH (${ICON_SIZE} bytes)${NC}"
        
        # Check if it's likely a proper size (rough estimate for 1024x1024 PNG)
        if [ $ICON_SIZE -gt 50000 ] && [ $ICON_SIZE -lt 2000000 ]; then
            echo -e "${GREEN}✅ Icon size looks reasonable for 1024x1024${NC}"
        else
            echo -e "${YELLOW}⚠️  Icon size may not be optimal. Expected ~50KB-2MB for 1024x1024 PNG${NC}"
        fi
    else
        echo -e "${RED}❌ Icon not found at: $ICON_PATH${NC}"
        echo -e "${YELLOW}   Please ensure you have a 1024x1024 square icon at this location${NC}"
        exit 1
    fi
fi

# Pre-build checks
echo -e "\n${CYAN}🔍 Running pre-build checks...${NC}"
echo -e "   Build Type: ${WHITE}$BUILD_TYPE${NC}"
echo -e "   Platform: ${WHITE}$PLATFORM${NC}"

# Clean install dependencies
echo -e "\n${CYAN}📦 Installing dependencies...${NC}"
npm install

# Build based on type and platform
echo -e "\n${CYAN}🏗️  Starting build process...${NC}"

case $BUILD_TYPE in
    "web")
        echo -e "${YELLOW}Building for web...${NC}"
        npx expo export --platform web
        echo -e "${GREEN}✅ Web build complete! Check the 'dist' folder${NC}"
        echo -e "${CYAN}   You can serve it locally with: npx serve dist${NC}"
        ;;
    "development")
        echo -e "${YELLOW}Starting development build...${NC}"
        if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
            eas build --platform android --profile development --non-interactive
        fi
        if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
            eas build --platform ios --profile development --non-interactive
        fi
        ;;
    "preview")
        echo -e "${YELLOW}Building preview version (great for testing icons!)...${NC}"
        if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
            echo -e "${CYAN}🤖 Building Android APK...${NC}"
            eas build --platform android --profile preview --non-interactive
        fi
        if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
            echo -e "${CYAN}🍎 Building iOS preview...${NC}"
            eas build --platform ios --profile preview --non-interactive
        fi
        ;;
    "production")
        echo -e "${YELLOW}Building production version...${NC}"
        echo -e "${YELLOW}⚠️  This will increment version numbers!${NC}"
        read -p "Continue with production build? (y/N): " confirm
        if [[ $confirm == [yY] ]]; then
            if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
                eas build --platform android --profile production --non-interactive
            fi
            if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
                eas build --platform ios --profile production --non-interactive
            fi
        else
            echo -e "${YELLOW}Production build cancelled.${NC}"
            exit 0
        fi
        ;;
esac

echo -e "\n${GREEN}✨ Build process completed!${NC}"
echo -e "\n${CYAN}📱 Next steps:${NC}"
echo -e "   ${WHITE}1. Check your EAS dashboard: https://expo.dev/accounts/[your-account]/projects/myseedbook-catalogue/builds${NC}"
echo -e "   ${WHITE}2. Download the build when ready${NC}"
echo -e "   ${WHITE}3. Install on device to test icon and functionality${NC}"
echo -e "   ${WHITE}4. Verify icon appears correctly on home screen${NC}"

if [ "$BUILD_TYPE" = "preview" ]; then
    echo -e "\n${MAGENTA}🎨 Icon Testing Checklist:${NC}"
    echo -e "   ${WHITE}✓ Icon appears on device home screen${NC}"
    echo -e "   ${WHITE}✓ Icon is square (not stretched)${NC}"
    echo -e "   ${WHITE}✓ Icon is clear and readable at small sizes${NC}"
    echo -e "   ${WHITE}✓ Icon matches your app's gardening theme${NC}"
    echo -e "   ${WHITE}✓ Background color works with adaptive icons (Android)${NC}"
fi
