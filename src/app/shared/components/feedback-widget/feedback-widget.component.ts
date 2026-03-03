import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardInputDirective } from '@/shared/components/input/input.directive';
import { FeedbackService } from '@/features/feedback/services/feedback.service';
import { FeedbackCategory } from '@/features/feedback/models/feedback.model';

@Component({
  selector: 'app-feedback-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective
  ],
  templateUrl: './feedback-widget.component.html',
  styleUrls: ['./feedback-widget.component.css']
})
export class FeedbackWidgetComponent {
  private feedbackService = inject(FeedbackService);
  private router = inject(Router);

  isOpen = signal(false);
  submitting = signal(false);
  submitted = signal(false);
  error = signal<string | null>(null);

  // Form fields
  rating = signal(0);
  hoverRating = signal(0);
  category = signal<FeedbackCategory | ''>('');
  description = signal('');
  screenshotFile = signal<File | null>(null);
  screenshotPreview = signal<string | null>(null);

  categories: { value: FeedbackCategory; label: string }[] = [
    { value: 'bug', label: 'Bug Report' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'ui_ux', label: 'UI/UX' },
    { value: 'performance', label: 'Performance' },
    { value: 'general', label: 'General' }
  ];

  toggleWidget(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.isOpen.set(true);
      this.submitted.set(false);
      this.error.set(null);
    }
  }

  close(): void {
    this.isOpen.set(false);
    // Reset form after animation
    setTimeout(() => {
      if (!this.isOpen()) {
        this.resetForm();
      }
    }, 300);
  }

  setRating(value: number): void {
    this.rating.set(value);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.error.set('Screenshot must be less than 5MB');
      return;
    }

    this.screenshotFile.set(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.screenshotPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeScreenshot(): void {
    this.screenshotFile.set(null);
    this.screenshotPreview.set(null);
  }

  isFormValid(): boolean {
    return this.rating() > 0 && this.category() !== '' && this.description().length >= 10;
  }

  submit(): void {
    if (!this.isFormValid() || this.submitting()) return;

    this.submitting.set(true);
    this.error.set(null);

    this.feedbackService.submitFeedback({
      category: this.category() as FeedbackCategory,
      rating: this.rating(),
      description: this.description(),
      page_url: this.router.url,
      screenshot: this.screenshotFile() || undefined
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.submitted.set(true);
          setTimeout(() => this.close(), 2000);
        }
        this.submitting.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to submit feedback. Please try again.');
        this.submitting.set(false);
      }
    });
  }

  private resetForm(): void {
    this.rating.set(0);
    this.hoverRating.set(0);
    this.category.set('');
    this.description.set('');
    this.screenshotFile.set(null);
    this.screenshotPreview.set(null);
    this.error.set(null);
    this.submitted.set(false);
  }
}
