# ZardUI Migration Guide - HRMS Project

## Overview
This document outlines the successful migration from Bootstrap 5 to ZardUI (a shadcn/ui alternative for Angular) with Tailwind CSS.

## What Changed

### ✅ Completed Migration Steps

1. **Removed Bootstrap 5 and Custom Theme**
   - Deleted `src/assets/theme` directory (all Bootstrap files, scripts, and media assets)
   - Removed Bootstrap CSS/JS references from `angular.json`

2. **Installed Tailwind CSS v3**
   - Packages: `tailwindcss@^3`, `postcss`, `autoprefixer`
   - Created `tailwind.config.js` with extended theme configuration (colors, border radius)
   - Created `postcss.config.js` for PostCSS integration
   - Updated `src/styles.css` with Tailwind directives (@tailwind base, components, utilities)

3. **Installed ZardUI**
   - Package: `@ngzard/ui`
   - Utility packages: `class-variance-authority`, `clsx`, `tailwind-merge`

4. **Configured Path Aliases**
   - Updated `tsconfig.app.json` with path mappings:
     - `@/*` → `./src/*`
     - `@/components/*` → `./src/app/components/*`
     - `@/core/*` → `./src/app/core/*`
     - `@/lib/*` → `./src/app/lib/*`

5. **Converted SCSS to CSS**
   - Converted all 37 SCSS files to CSS for ZardUI compatibility
   - Updated all component `styleUrl` references
   - Changed Angular configuration to use CSS instead of SCSS
   - See [SCSS_TO_CSS_MIGRATION.md](SCSS_TO_CSS_MIGRATION.md) for details

6. **Set Up ZardUI Theming**
   - Added CSS variables in `src/styles.css` for light/dark themes
   - Variables include: background, foreground, primary, secondary, muted, accent, destructive, border, input, ring
   - Dark mode support via `.dark` class

7. **Created Utility Functions**
   - Created `src/app/lib/utils.ts` with `cn()` helper function for class merging

8. **Created ZardUI Configuration**
   - Created `components.json` at project root with ZardUI settings

9. **Updated Documentation**
   - Updated PRD to reflect ZardUI as the styling framework

## New File Structure

```
HRMS_v1/
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
├── components.json             # ZardUI configuration
├── src/
│   ├── styles.css             # Main styles with Tailwind + ZardUI variables
│   └── app/
│       ├── lib/
│       │   └── utils.ts       # cn() utility function
│       ├── core/              # Core utilities (existing)
│       ├── components/        # Future ZardUI components location
│       └── features/          # All feature modules (now using .css)
```

## How to Use ZardUI Components

### Adding Components
ZardUI components can be added using their CLI or manually. Visit [ZardUI Components](https://zardui.com/docs/components) to browse available components.

### Example: Using the cn() Utility
```typescript
import { cn } from '@/lib/utils';

// In your component
export class MyComponent {
  getButtonClasses(isPrimary: boolean) {
    return cn(
      'px-4 py-2 rounded-md',
      isPrimary ? 'bg-primary text-primary-foreground' : 'bg-secondary'
    );
  }
}
```

### Example: Using ZardUI Components
```typescript
// Import from @ngzard/ui
import { ButtonComponent } from '@ngzard/ui/button';

@Component({
  selector: 'app-example',
  imports: [ButtonComponent],
  template: `
    <ui-button variant="default">Click me</ui-button>
  `
})
```

## Theming

### Light Mode (Default)
The default theme uses professional blue tones suitable for an enterprise HRMS:
- Primary: Blue (#0066cc equivalent in HSL)
- Background: White
- Text: Dark gray

### Dark Mode
Add the `dark` class to any parent element to enable dark mode:
```html
<div class="dark">
  <!-- All child elements will use dark theme -->
</div>
```

### Customizing Colors
Edit the CSS variables in `src/styles.css` under `:root` (light) and `.dark` (dark theme).

## Available Tailwind Classes

ZardUI is built on Tailwind CSS. Common utility classes:

### Layout
- `flex`, `grid`, `block`, `inline-block`
- `container`, `mx-auto`
- `w-full`, `h-screen`

### Spacing
- `p-4`, `px-6`, `py-2` (padding)
- `m-4`, `mx-auto`, `my-6` (margin)
- `space-x-4`, `space-y-2` (gap between children)

### Typography
- `text-sm`, `text-base`, `text-lg`, `text-xl`
- `font-bold`, `font-semibold`, `font-normal`
- `text-foreground`, `text-muted-foreground`

### Colors (Using Theme Variables)
- `bg-background`, `bg-primary`, `bg-secondary`
- `text-foreground`, `text-primary`, `text-destructive`
- `border-border`, `ring-ring`

### Borders & Shadows
- `rounded-md`, `rounded-lg`, `rounded-full`
- `border`, `border-2`, `border-border`
- `shadow-sm`, `shadow-md`, `shadow-lg`

## Next Steps

1. **Create Shared Components**
   - Create reusable UI components in `src/app/components/ui/`
   - Examples: buttons, cards, forms, tables, modals

2. **Update Existing Components**
   - Gradually migrate existing components to use Tailwind classes
   - Replace Bootstrap classes with Tailwind equivalents

3. **Add ZardUI Components as Needed**
   - Button, Card, Input, Select, Dialog, etc.
   - Visit https://zardui.com/docs/components for the full list

4. **Implement Dark Mode Toggle**
   - Create a service to manage theme state
   - Toggle `dark` class on root element

## Resources

- **ZardUI Documentation**: https://zardui.com/docs
- **ZardUI Components**: https://zardui.com/docs/components
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **ZardUI GitHub**: Check for examples and issues
- **NPM Package**: @ngzard/ui

## Migration Checklist for Existing Code

When updating existing components from Bootstrap to ZardUI/Tailwind:

- [ ] Replace `class="btn btn-primary"` with Tailwind button classes
- [ ] Replace `class="card"` with Tailwind card structure
- [ ] Replace `class="container"` with `class="container mx-auto"`
- [ ] Replace Bootstrap grid (`row`, `col-*`) with Tailwind grid/flex
- [ ] Replace Bootstrap form classes with ZardUI form components
- [ ] Replace Bootstrap modals with ZardUI Dialog component
- [ ] Replace Bootstrap alerts with ZardUI Alert component
- [ ] Update color references to use theme variables
- [ ] Test dark mode compatibility

## Notes

- The migration is complete and ready for development
- All old Bootstrap theme files have been removed
- Tailwind CSS and ZardUI are properly configured
- The app is ready to build and run with the new styling system
- Remember to use the `cn()` utility for conditional classes
