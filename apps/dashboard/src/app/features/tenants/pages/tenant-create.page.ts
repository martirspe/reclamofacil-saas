import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-tenant-create-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './tenant-create.page.html',
  styleUrls: ['./tenant-create.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TenantCreatePage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly slugManuallyEdited = signal(false);
  readonly suggestedSlug = signal('');
  readonly step = signal<1 | 2 | 3>(1);

  readonly form = this.fb.nonNullable.group({
    // Paso 1: empresa
    slug: ['', [Validators.required, Validators.minLength(2)]],
    brand_name: ['', [Validators.required, Validators.minLength(2)]],
    legal_name: ['', [Validators.required, Validators.minLength(2)]],
    tax_id: ['', [Validators.required, Validators.minLength(8)]],
    contact_phone: ['', [Validators.required, Validators.minLength(6)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    country: ['', [Validators.required]],
    industry: ['', [Validators.required]],
    contact_email: ['', [Validators.required, Validators.email]],
    website: [''],
    primary_color: ['#007bff'],
    accent_color: ['#6c757d'],
    terms_url: [''],
    privacy_url: [''],
    // Paso 2: libro
    book_slug: ['', [Validators.required, Validators.minLength(3)]],
    whatsapp: ['', [Validators.required, Validators.minLength(6)]],
    public_site_url: [''],
    // Paso 3: plan
    plan_id: ['emprendedor', [Validators.required]],
    billing_cycle: ['mensual', [Validators.required]]
  });

  get slugControl() {
    return this.form.controls.slug;
  }

  get brandNameControl() {
    return this.form.controls.brand_name;
  }

  get legalNameControl() {
    return this.form.controls.legal_name;
  }

  get taxIdControl() {
    return this.form.controls.tax_id;
  }

  get contactPhoneControl() {
    return this.form.controls.contact_phone;
  }

  get addressControl() {
    return this.form.controls.address;
  }

  get countryControl() {
    return this.form.controls.country;
  }

  get industryControl() {
    return this.form.controls.industry;
  }

  get contactEmailControl() {
    return this.form.controls.contact_email;
  }

  get bookSlugControl() {
    return this.form.controls.book_slug;
  }

  get whatsappControl() {
    return this.form.controls.whatsapp;
  }

  get planIdControl() {
    return this.form.controls.plan_id;
  }

  ngOnInit() {
    this.brandNameControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const suggestion = this.normalizeSlug(value || '');
        this.suggestedSlug.set(suggestion);
        if (!this.slugManuallyEdited()) {
          this.form.controls.slug.setValue(suggestion, { emitEvent: false });
        }
      });
  }

  onSlugInput() {
    if (!this.slugManuallyEdited()) {
      this.slugManuallyEdited.set(true);
    }
  }

  useSuggestedSlug() {
    const suggestion = this.suggestedSlug();
    if (!suggestion) {
      return;
    }
    this.slugManuallyEdited.set(false);
    this.form.controls.slug.setValue(suggestion);
  }

  submit() {
    if (this.isSubmitting()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const values = this.form.getRawValue();
    const payload = {
      slug: this.normalizeSlug(values.slug),
      brand_name: values.brand_name,
      legal_name: values.legal_name,
      tax_id: values.tax_id,
      contact_phone: values.contact_phone,
      address: values.address,
      country: values.country,
      industry: values.industry,
      contact_email: values.contact_email,
      website: values.website,
      primary_color: values.primary_color,
      accent_color: values.accent_color,
      terms_url: values.terms_url,
      privacy_url: values.privacy_url
    };

    this.http
      .post<{ message: string; tenant?: { slug?: string } }>(`${environment.API_URL}/api/tenants`, payload)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.message || 'Tenant creado exitosamente.');
          this.router.navigateByUrl('/dashboard');
        },
        error: (error) => {
          const maybeHttpError = error as { error?: { message?: string }; message?: string } | null;
          this.errorMessage.set(
            maybeHttpError?.error?.message ||
              maybeHttpError?.message ||
              'No pudimos crear el tenant. Inténtalo nuevamente.'
          );
        }
      });
  }

  nextStep() {
    if (this.step() === 1 && this.isStepOneInvalid()) {
      this.markStepOneTouched();
      return;
    }
    if (this.step() === 2 && this.isStepTwoInvalid()) {
      this.markStepTwoTouched();
      return;
    }
    if (this.step() < 3) {
      this.step.set((this.step() + 1) as 1 | 2 | 3);
    }
  }

  prevStep() {
    if (this.step() > 1) {
      this.step.set((this.step() - 1) as 1 | 2 | 3);
    }
  }

  private isStepOneInvalid(): boolean {
    return (
      this.slugControl.invalid ||
      this.brandNameControl.invalid ||
      this.legalNameControl.invalid ||
      this.taxIdControl.invalid ||
      this.contactPhoneControl.invalid ||
      this.addressControl.invalid ||
      this.countryControl.invalid ||
      this.industryControl.invalid ||
      this.contactEmailControl.invalid
    );
  }

  private isStepTwoInvalid(): boolean {
    return this.bookSlugControl.invalid || this.whatsappControl.invalid;
  }

  private markStepOneTouched() {
    this.slugControl.markAsTouched();
    this.brandNameControl.markAsTouched();
    this.legalNameControl.markAsTouched();
    this.taxIdControl.markAsTouched();
    this.contactPhoneControl.markAsTouched();
    this.addressControl.markAsTouched();
    this.countryControl.markAsTouched();
    this.industryControl.markAsTouched();
    this.contactEmailControl.markAsTouched();
  }

  private markStepTwoTouched() {
    this.bookSlugControl.markAsTouched();
    this.whatsappControl.markAsTouched();
  }

  private normalizeSlug(value: string): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
