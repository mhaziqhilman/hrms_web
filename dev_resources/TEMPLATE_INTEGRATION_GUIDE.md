# Keenthemes Seven HTML Template Integration Guide
## HRMS Angular 21 Project

---

## Overview

This guide explains how to integrate the Keenthemes Seven HTML Pro template into the HRMS Angular 21 application.

**Template**: Seven HTML Pro by Keenthemes
**Framework**: Angular 21
**Styling**: Bootstrap 5 + Custom Keenthemes SCSS
**Source**: `dev_resources/theme/`

---

## Template Structure

```
dev_resources/theme/
├── dist/                    # Compiled/production files
│   ├── assets/
│   │   ├── css/            # Compiled stylesheets
│   │   ├── js/             # Compiled JavaScript
│   │   ├── media/          # Images, icons, illustrations
│   │   └── plugins/        # Third-party plugins
│   ├── index.html          # Main dashboard
│   ├── account/            # Account pages
│   ├── general/            # General pages
│   └── documentation/      # Theme documentation
│
└── src/                    # Source files for customization
    ├── js/                 # JavaScript components
    ├── media/              # Raw media files
    └── sass/               # SASS source files
```

---

## Integration Steps

### Step 1: Copy Template Assets to Angular

#### 1.1 Copy Stylesheets
```bash
# Copy main CSS bundle
cp dev_resources/theme/dist/assets/css/style.bundle.css src/assets/theme/css/

# Copy plugins CSS
cp -r dev_resources/theme/dist/assets/plugins src/assets/theme/
```

#### 1.2 Copy JavaScript
```bash
# Copy main JS bundles
cp dev_resources/theme/dist/assets/js/*.bundle.js src/assets/theme/js/
```

#### 1.3 Copy Media Files
```bash
# Copy all media (logos, icons, illustrations, avatars)
cp -r dev_resources/theme/dist/assets/media src/assets/theme/
```

### Step 2: Configure Angular.json

Add template assets to `angular.json`:

```json
{
  "projects": {
    "HRMS": {
      "architect": {
        "build": {
          "options": {
            "assets": [
              "src/assets",
              {
                "glob": "**/*",
                "input": "src/assets/theme",
                "output": "/assets/theme"
              }
            ],
            "styles": [
              "src/styles.scss",
              "src/assets/theme/plugins/global/plugins.bundle.css",
              "src/assets/theme/css/style.bundle.css"
            ],
            "scripts": [
              "src/assets/theme/plugins/global/plugins.bundle.js",
              "src/assets/theme/js/scripts.bundle.js"
            ]
          }
        }
      }
    }
  }
}
```

### Step 3: Create Angular Module Structure

```
src/app/
├── core/                       # Singleton services, guards
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── no-auth.guard.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── theme.service.ts
│   └── interceptors/
│       └── auth.interceptor.ts
│
├── shared/                     # Reusable components
│   ├── components/
│   │   ├── header/
│   │   ├── sidebar/
│   │   └── footer/
│   └── directives/
│
└── features/
    ├── auth/                   # Authentication module
    │   ├── components/
    │   │   ├── login/
    │   │   ├── register/
    │   │   ├── forgot-password/
    │   │   └── reset-password/
    │   ├── auth-routing.module.ts
    │   └── auth.module.ts
    │
    └── dashboard/              # Dashboard module
        └── ...
```

---

## Authentication Pages Integration

### Login Page Structure

The Keenthemes template uses a specific HTML structure for authentication pages:

```html
<!-- Minimal Layout for Auth Pages -->
<body id="kt_body" class="bg-body">
  <div class="d-flex flex-column flex-root">
    <div class="d-flex flex-column flex-column-fluid bgi-position-y-bottom position-x-center bgi-no-repeat bgi-size-contain bgi-attachment-fixed">
      <!-- Auth Content -->
      <div class="d-flex flex-center flex-column flex-column-fluid p-10 pb-lg-20">
        <!-- Form Card -->
        <div class="w-lg-500px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto">
          <!-- Your Angular Component Here -->
        </div>
      </div>
      <!-- Footer -->
    </div>
  </div>
</body>
```

### Key CSS Classes to Use

#### Layout Classes
- `bg-body` - Body background
- `d-flex flex-column flex-root` - Root container
- `flex-center` - Center content

#### Card Classes
- `w-lg-500px` - Max width for forms
- `bg-body` - Card background
- `rounded shadow-sm` - Card styling
- `p-10 p-lg-15` - Padding

#### Form Classes
- `form` - Form container
- `fv-row mb-10` - Form row with validation
- `form-label fs-6 fw-bolder text-dark` - Label styling
- `form-control form-control-lg form-control-solid` - Input styling
- `btn btn-lg btn-primary w-100` - Button styling

#### Icon Classes
- `svg-icon svg-icon-2` - Icon sizing
- `text-muted` - Muted text color

---

## Theme Features to Integrate

### 1. Dark Mode Support
The template has built-in dark mode. To enable:

```typescript
// theme.service.ts
export class ThemeService {
  private currentTheme: 'light' | 'dark' = 'light';

  toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-bs-theme', this.currentTheme);
  }
}
```

### 2. Form Validation
Use the template's validation classes:

```html
<div class="fv-row mb-10">
  <input class="form-control" [class.is-invalid]="formControl.invalid && formControl.touched">
  <div class="fv-plugins-message-container invalid-feedback">
    Error message here
  </div>
</div>
```

### 3. Toastr Notifications
The template includes toastr. Configure in Angular:

```typescript
// Install: npm install ngx-toastr
import { ToastrModule } from 'ngx-toastr';

@NgModule({
  imports: [
    ToastrModule.forRoot({
      toastClass: 'toast toast-custom',
      positionClass: 'toast-top-right',
    })
  ]
})
```

---

## Component Integration Pattern

### Example: Login Component

```typescript
// login.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      // Auth logic here
    }
  }
}
```

```html
<!-- login.component.html -->
<div class="d-flex flex-column flex-root">
  <div class="d-flex flex-column flex-column-fluid bgi-position-y-bottom position-x-center bgi-no-repeat bgi-size-contain bgi-attachment-fixed">
    <div class="d-flex flex-center flex-column flex-column-fluid p-10 pb-lg-20">
      <div class="w-lg-500px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto">
        <!-- Logo -->
        <div class="text-center mb-10">
          <img alt="Logo" src="assets/theme/media/logos/logo-default.svg" class="h-50px">
        </div>

        <!-- Title -->
        <div class="text-center mb-10">
          <h1 class="text-dark mb-3">Sign In to HRMS</h1>
          <div class="text-gray-400 fw-bold fs-4">
            New Here?
            <a routerLink="/auth/register" class="link-primary fw-bolder">Create an Account</a>
          </div>
        </div>

        <!-- Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="form w-100">
          <!-- Email -->
          <div class="fv-row mb-10">
            <label class="form-label fs-6 fw-bolder text-dark">Email</label>
            <input
              type="email"
              formControlName="email"
              class="form-control form-control-lg form-control-solid"
              [class.is-invalid]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              placeholder="Email">
            <div class="fv-plugins-message-container invalid-feedback"
                 *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
              Please enter a valid email address
            </div>
          </div>

          <!-- Password -->
          <div class="fv-row mb-10">
            <div class="d-flex flex-stack mb-2">
              <label class="form-label fw-bolder text-dark fs-6 mb-0">Password</label>
              <a routerLink="/auth/forgot-password" class="link-primary fs-6 fw-bolder">
                Forgot Password?
              </a>
            </div>
            <input
              type="password"
              formControlName="password"
              class="form-control form-control-lg form-control-solid"
              [class.is-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              placeholder="Password">
          </div>

          <!-- Submit Button -->
          <div class="text-center">
            <button type="submit"
                    class="btn btn-lg btn-primary w-100 mb-5"
                    [disabled]="loginForm.invalid || loading">
              <span *ngIf="!loading">Continue</span>
              <span *ngIf="loading" class="spinner-border spinner-border-sm"></span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
```

---

## Assets Mapping

### Required Assets for Auth Module

```
src/assets/theme/
├── css/
│   └── style.bundle.css        # Main stylesheet
├── js/
│   ├── plugins.bundle.js       # All plugins
│   └── scripts.bundle.js       # Theme scripts
├── media/
│   ├── logos/
│   │   ├── logo-default.svg    # Main logo
│   │   └── favicon.ico         # Favicon
│   ├── illustrations/
│   │   └── sketchy-1/          # Auth page illustrations
│   ├── svg/
│   │   └── icons/              # SVG icons
│   └── auth/
│       └── bg*.jpg             # Background images
└── plugins/
    └── global/
        └── plugins.bundle.css  # Plugins CSS
```

---

## Important Notes

### 1. **Bootstrap 5 Compatibility**
- Template uses Bootstrap 5.3
- Ensure no conflicts with Tailwind (if using both)
- Use Bootstrap utilities where possible

### 2. **JavaScript Components**
- Menu, Drawer, Stepper, etc. are vanilla JS
- May need Angular wrappers for full functionality
- Consider using Angular equivalents for complex components

### 3. **Icon System**
- Template uses SVG icons (inline)
- Icons are in `media/svg/icons/`
- Consider creating an Angular icon component

### 4. **Responsive Design**
- Template is fully responsive
- Uses Bootstrap breakpoints
- Test on mobile/tablet

### 5. **Performance**
- Large CSS/JS bundles (~2MB total)
- Consider lazy loading non-critical assets
- Use Angular's production build optimizations

---

## Next Steps

1. ✅ Copy assets from `dev_resources/theme/dist/assets/` to `src/assets/theme/`
2. ✅ Update `angular.json` with asset paths
3. ✅ Create auth module structure
4. ✅ Implement login component
5. ✅ Implement register component
6. ✅ Implement forgot/reset password components
7. ✅ Test responsiveness
8. ✅ Implement dark mode toggle
9. ✅ Add form validation
10. ✅ Integrate with backend API

---

## Resources

- **Template Docs**: `dev_resources/theme/dist/documentation/`
- **Bootstrap 5 Docs**: https://getbootstrap.com/docs/5.3/
- **Angular Docs**: https://angular.dev/
- **Keenthemes Support**: https://keenthemes.com/

---

**Ready to start integration!**
