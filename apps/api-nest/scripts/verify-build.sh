#!/bin/bash

echo "🔍 Verifying NestJS API build..."
echo "================================"

# Check TypeScript compilation
echo "✓ TypeScript compilation check..."
pnpm tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful - 0 errors!"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi

# Check if build works
echo ""
echo "✓ Running production build..."
pnpm build

if [ $? -eq 0 ]; then
    echo "✅ Production build successful!"
else
    echo "❌ Production build failed"
    exit 1
fi

echo ""
echo "🎉 All checks passed! The API is ready to compile and run."