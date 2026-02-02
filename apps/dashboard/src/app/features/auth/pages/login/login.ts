import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../core/auth/auth.service';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle.component';
import { ToastService } from '../../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ThemeToggleComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly isSubmitting = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    remember: [true]
  });

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.router.navigateByUrl('/');
    }
  }

  get emailControl() {
    return this.form.controls.email;
  }

  get passwordControl() {
    return this.form.controls.password;
  }

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  submit() {
    if (this.isSubmitting()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, remember } = this.form.getRawValue();
    const tenantSlug = this.route.snapshot.queryParamMap.get('tenant');

    this.isSubmitting.set(true);

    this.auth
      .login(email.trim(), password, tenantSlug, remember)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.toast.showSuccess('¡Sesión iniciada correctamente!', 'Bienvenido');
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
          this.router.navigateByUrl(returnUrl);
        },
        error: (error) => {
          const message = this.resolveErrorMessage(error);
          this.toast.showError(message, 'Error al iniciar sesión');
        }
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    const maybeHttpError = error as { error?: { message?: string }; message?: string } | null;
    return (
      maybeHttpError?.error?.message ||
      maybeHttpError?.message ||
      'No pudimos iniciar sesión. Verifica tus credenciales e inténtalo de nuevo.'
    );
  }
}
