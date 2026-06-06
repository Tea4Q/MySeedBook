#!/bin/bash
# Production Build Script for MySeedBook Catalogue

echo "🚀 MySeedBook Catalogue - Production Build Script"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Pre-build validation
echo -e "${YELLOW}🔍 Pre-build validation...${NC}"

# Check if EAS CLI is installed
if ! command_exists eas; then
    echo -e "${RED}❌ EAS CLI not found. Installing...${NC}"
    npm install -g @expo/eas-cli@latest
fi

# Check if user is logged in to Expo
if ! eas whoami >/dev/null 2>&1; then
    echo -e "${RED}❌ Not logged in to Expo. Please run 'eas login' first.${NC}"
    exit 1
fi

# Validate environment
echo -e "${YELLOW}🔧 Validating environment...${NC}"

# Check for required files
required_files=("app.json" "eas.json" "package.json")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing required file: $file${NC}"
        exit 1
    fi
done

# Check for production environment variables
if [ ! -f ".env.production" ] && [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️ No environment file found. Make sure production environment is configured.${NC}"
fi

# Security scan
echo -e "${YELLOW}🔒 Running production security scan...${NC}"

# Check for authentication bypasses
if grep -r -i "bypass.*auth\|auth.*bypass" app/ components/ lib/ 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL: Authentication bypass found! Remove before production.${NC}"
    exit 1
fi

# Check for debug code
debug_count=$(grep -r "console\.log\|console\.debug\|alert(" app/ components/ --exclude-dir=node_modules 2>/dev/null | wc -l)
if [ "$debug_count" -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Found $debug_count debug statements - review before production${NC}"
fi

echo -e "${GREEN}✅ Security scan completed${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Run TypeScript check
echo -e "${YELLOW}🔍 Running TypeScript check...${NC}"
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ TypeScript errors found. Fix before building.${NC}"
    exit 1
fi

# Run Expo doctor
echo -e "${YELLOW}🩺 Running Expo doctor...${NC}"
npx expo doctor

echo -e "${GREEN}✅ All validations passed!${NC}"
echo ""

# Build options
echo -e "${YELLOW}📱 Select build option:${NC}"
echo "1. Production Android (AAB for Play Store)"
echo "2. Production iOS (for App Store)"
echo "3. Production Both Platforms"
echo "4. Production Android APK (for testing)"

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo -e "${GREEN}🤖 Building Android production (AAB)...${NC}"
        eas build --platform android --profile production --non-interactive
        ;;
    2)
        echo -e "${GREEN}🍎 Building iOS production...${NC}"
        eas build --platform ios --profile production --non-interactive
        ;;
    3)
        echo -e "${GREEN}📱 Building both platforms...${NC}"
        eas build --platform all --profile production --non-interactive
        ;;
    4)
        echo -e "${GREEN}🤖 Building Android APK...${NC}"
        eas build --platform android --profile production-apk --non-interactive
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo "1. Test the build on physical devices"
    echo "2. Submit to app stores if testing passes"
    echo "3. Monitor for any production issues"
    echo ""
    echo "🔗 Check build status: https://expo.dev/accounts/your-account/projects/myseedbook-catalogue/builds"
else
    echo -e "${RED}❌ Build failed. Check the logs above.${NC}"
    exit 1
fi
