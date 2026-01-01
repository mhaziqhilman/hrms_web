# ZardUI Migration Checklist

## ✅ Completed Tasks

- [x] Remove Bootstrap 5 theme files from `src/assets/theme`
- [x] Remove Bootstrap references from `angular.json`
- [x] Install Tailwind CSS v3 and dependencies
- [x] Install ZardUI (@ngzard/ui) and utility packages
- [x] Create `tailwind.config.js` with ZardUI theme
- [x] Create `postcss.config.js` for PostCSS integration
- [x] Update `src/styles.scss` with Tailwind directives and CSS variables
- [x] Configure path aliases in `tsconfig.app.json`
- [x] Create `src/app/lib/utils.ts` with cn() helper
- [x] Create `components.json` configuration
- [x] Update PRD document with new tech stack
- [x] Verify build passes successfully
- [x] Adjust budget limits in `angular.json`

## 📋 Next Actions for Development

### Immediate (Today/This Week)
- [ ] Review the running application at http://localhost:4200
- [ ] Test all existing features to ensure nothing broke
- [ ] Read `ZARDUI_MIGRATION_GUIDE.md` thoroughly
- [ ] Browse [ZardUI Components](https://zardui.com/docs/components) to familiarize yourself

### Short Term (This Sprint)
- [ ] Create first ZardUI component (recommended: Button)
- [ ] Set up dark mode toggle functionality
- [ ] Create a style guide page showcasing ZardUI components
- [ ] Update one existing component to use Tailwind classes (start small)

### Component Migration Priority
**Suggested order based on impact:**

1. **Shared Components** (highest reuse)
   - [ ] Button component
   - [ ] Card component
   - [ ] Input/Form controls
   - [ ] Modal/Dialog component
   - [ ] Alert/Toast notifications

2. **Layout Components**
   - [ ] Header/Navigation
   - [ ] Sidebar
   - [ ] Footer
   - [ ] Container/Grid layouts

3. **Feature Components** (migrate as needed)
   - [ ] Dashboard widgets
   - [ ] Employee forms
   - [ ] Payroll tables
   - [ ] Leave management
   - [ ] Claims forms

### Adding Your First ZardUI Component

**Example: Adding a Button Component**

1. Visit https://zardui.com/docs/components/button
2. Copy the component code
3. Add to your project:
   ```typescript
   // src/app/components/ui/button.component.ts
   import { Component, input } from '@angular/core';
   import { cn } from '@/lib/utils';

   @Component({
     selector: 'ui-button',
     standalone: true,
     template: `
       <button [class]="computedClass()" [type]="type()">
         <ng-content />
       </button>
     `
   })
   export class ButtonComponent {
     variant = input<'default' | 'primary' | 'secondary'>('default');
     size = input<'sm' | 'md' | 'lg'>('md');
     type = input<'button' | 'submit'>('button');

     computedClass() {
       return cn(
         'inline-flex items-center justify-center rounded-md font-medium transition-colors',
         'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
         this.variant() === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
         this.variant() === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
         this.size() === 'sm' && 'h-8 px-3 text-sm',
         this.size() === 'md' && 'h-10 px-4',
         this.size() === 'lg' && 'h-12 px-6 text-lg'
       );
     }
   }
   ```

4. Use it in your components:
   ```typescript
   import { ButtonComponent } from '@/components/ui/button.component';

   @Component({
     selector: 'app-example',
     imports: [ButtonComponent],
     template: `
       <ui-button variant="primary" size="md">
         Click me
       </ui-button>
     `
   })
   ```

## 🎨 Theme Customization

### Changing Brand Colors
Edit `src/styles.scss` under `:root`:

```scss
:root {
  --primary: 221.2 83.2% 53.3%;  /* Your brand blue */
  --secondary: 210 40% 96.1%;    /* Light gray */
  --accent: 210 40% 96.1%;        /* Accent color */
  // ... other variables
}
```

### Adding Custom Colors
Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      // Add your custom colors
      brand: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        // ... other shades
      }
    }
  }
}
```

## 📚 Learning Resources

### Must-Read
- [ ] [Tailwind CSS Basics](https://tailwindcss.com/docs/utility-first)
- [ ] [ZardUI Installation](https://zardui.com/docs/installation/angular)
- [ ] [ZardUI Components](https://zardui.com/docs/components)

### Recommended
- [ ] [Tailwind CSS Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)
- [ ] [shadcn/ui Docs](https://ui.shadcn.com/) (similar library for reference)

## 🔧 Common Tasks

### Adding a New ZardUI Component
```bash
# Visit https://zardui.com/docs/components
# Copy the component code
# Add to src/app/components/ui/
```

### Using Tailwind Classes in Templates
```html
<!-- Flexbox -->
<div class="flex items-center justify-between gap-4">

<!-- Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

<!-- Spacing -->
<div class="p-4 m-2">  <!-- padding: 1rem, margin: 0.5rem -->

<!-- Colors -->
<div class="bg-primary text-primary-foreground">

<!-- Typography -->
<h1 class="text-2xl font-bold">Title</h1>
<p class="text-sm text-muted-foreground">Description</p>
```

### Dark Mode Implementation
```typescript
// Create a theme service
export class ThemeService {
  toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
  }
}
```

## ⚠️ Migration Notes

### Things to Keep in Mind
- Existing SCSS files still work (backwards compatible)
- No rush to migrate everything - do it gradually
- Start with new features using ZardUI
- Use Tailwind classes over custom SCSS when possible
- The `cn()` utility is your friend for conditional classes

### Common Pitfalls to Avoid
- ❌ Don't mix Bootstrap classes with Tailwind (remove Bootstrap first)
- ❌ Don't write custom CSS for things Tailwind can do
- ❌ Don't forget to use `cn()` for combining conditional classes
- ✅ Do use Tailwind's responsive modifiers (sm:, md:, lg:)
- ✅ Do leverage the theme variables for consistency
- ✅ Do create reusable components for common patterns

## 📊 Success Metrics

Track your migration progress:
- [ ] 0-25%: Getting started, first components added
- [ ] 25-50%: Main shared components migrated
- [ ] 50-75%: Most feature components updated
- [ ] 75-100%: Full migration, cleanup old SCSS

## 🆘 Getting Help

### If Something Breaks
1. Check browser console for errors
2. Verify Tailwind classes are working (inspect element)
3. Ensure PostCSS is processing correctly
4. Check that imports are using correct path aliases

### Resources
- ZardUI GitHub: Search for issues
- Tailwind CSS Discord: Community support
- Stack Overflow: Tag with `tailwindcss` and `angular`

---

**Current Status**: ✅ Ready to Start Development
**Last Updated**: 2025-12-23
