# Mobile-First Component Design Guide

## Overview

The itellico Mono Component Library has been redesigned with a mobile-first approach to ensure optimal user experience across all devices. This guide documents the mobile-responsive patterns and best practices implemented throughout the platform.

## Mobile-First Design Principles

### 1. Progressive Enhancement
- Start with mobile layout and enhance for larger screens
- Core functionality accessible on smallest devices
- Enhanced features and layouts for tablets and desktops

### 2. Responsive Breakpoints
```css
/* Mobile First Breakpoints */
- Mobile: 0-639px (default)
- Small tablets: 640px+ (sm:)
- Tablets: 768px+ (md:)
- Desktop: 1024px+ (lg:)
- Large desktop: 1280px+ (xl:)
```

## Component Patterns

### Container Layout
```tsx
// Mobile-first container with responsive padding
<div className="container mx-auto px-4 py-4 md:py-8 space-y-4 md:space-y-8 max-w-7xl">
```

### Grid Layouts
```tsx
// Single column on mobile, expanding to multiple columns
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">

// Responsive grid with mobile-first approach
<div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Tab Navigation
```tsx
// Responsive tabs that wrap on mobile
<TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 w-full gap-1 h-auto p-1">
  <TabsTrigger className="text-xs md:text-sm">Tab Name</TabsTrigger>
</TabsList>
```

### Typography
```tsx
// Responsive text sizes
<h1 className="text-2xl md:text-4xl font-bold">Heading</h1>
<p className="text-base md:text-lg">Body text</p>
<span className="text-sm md:text-base">Regular text</span>
```

### Buttons and Actions
```tsx
// Stack buttons on mobile, inline on larger screens
<div className="flex flex-col sm:flex-row gap-2">
  <Button>Primary Action</Button>
  <Button variant="outline">Secondary</Button>
</div>
```

### Forms
```tsx
// Full width on mobile, constrained on desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Input className="w-full" />
  <Select className="w-full" />
</div>
```

## Testing Mobile Responsiveness

### 1. Browser DevTools
- Chrome/Edge: F12 → Toggle device toolbar (Ctrl+Shift+M)
- Firefox: F12 → Responsive Design Mode (Ctrl+Shift+M)
- Safari: Develop → Enter Responsive Design Mode

### 2. Automated Screenshots
We provide Puppeteer scripts to capture screenshots across multiple devices:

```bash
# Run mobile screenshot script
npx tsx scripts/screenshot-mobile-components.ts

# Screenshots saved to: /screenshots/mobile-components/
```

### 3. Real Device Testing
- Test on actual mobile devices when possible
- Use services like BrowserStack for cross-device testing
- Pay attention to touch interactions and gesture support

## Common Mobile Patterns

### 1. Mobile Navigation
- Hamburger menu for main navigation
- Bottom tab bar for key actions
- Swipe gestures for tab switching

### 2. Touch-Friendly Interactions
- Minimum 44x44px touch targets
- Adequate spacing between interactive elements
- Clear focus states for accessibility

### 3. Performance Optimization
- Lazy load images and heavy components
- Minimize JavaScript bundle size
- Use CSS transforms for animations

### 4. Viewport Considerations
- Account for safe areas on modern devices
- Handle landscape orientation
- Test with virtual keyboards open

## Implementation Examples

### AdminListPage Mobile Optimization
```tsx
<AdminListPage
  columns={columns}
  data={data}
  // Mobile-optimized table with horizontal scroll
  tableClassName="min-w-full overflow-x-auto"
  // Responsive column visibility
  hiddenColumns={isMobile ? ['details', 'metadata'] : []}
/>
```

### Stats Cards
```tsx
// Responsive grid for stats
<div className="grid gap-4 grid-cols-2 md:grid-cols-4">
  {stats.map(stat => (
    <Card className="p-4">
      <div className="text-2xl font-bold">{stat.value}</div>
      <div className="text-sm text-muted-foreground">{stat.label}</div>
    </Card>
  ))}
</div>
```

### Modal Dialogs
```tsx
// Full screen on mobile, centered on desktop
<Dialog>
  <DialogContent className="sm:max-w-[425px] h-full sm:h-auto">
    {/* Modal content */}
  </DialogContent>
</Dialog>
```

## Accessibility Considerations

1. **Focus Management**: Ensure proper tab order on all screen sizes
2. **ARIA Labels**: Provide descriptive labels for mobile-specific UI
3. **Color Contrast**: Maintain WCAG AA standards on all devices
4. **Text Scaling**: Support browser zoom and text size preferences

## Performance Best Practices

1. **Optimize Images**: Use responsive images with srcset
2. **Code Splitting**: Load mobile-specific code only when needed
3. **CSS Optimization**: Use mobile-first CSS to minimize overrides
4. **Touch Events**: Use passive event listeners for better scrolling

## Screenshots

Mobile screenshots are automatically captured for:
- iPhone 14 (390x844)
- iPhone SE (375x667)
- Pixel 7 (412x915)
- iPad Mini (768x1024)
- Desktop (1920x1080)

View captured screenshots in `/screenshots/mobile-components/`

## Future Enhancements

1. **Progressive Web App**: Add PWA capabilities for mobile
2. **Offline Support**: Cache critical data for offline access
3. **Native Gestures**: Implement swipe actions for common tasks
4. **Adaptive Loading**: Load different components based on device capabilities