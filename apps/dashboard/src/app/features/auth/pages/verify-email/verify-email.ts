import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../core/auth/auth.service';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle.component';
import { ToastService } from '../../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ThemeToggleComponent],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyEmail implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly isSubmitting = signal(false);
  readonly isResending = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly emailHint = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    userId: [0, [Validators.required, Validators.min(1)]],
    code: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit() {
    const userIdParam = this.route.snapshot.queryParamMap.get('userId');
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (emailParam) {
      this.emailHint.set(emailParam);
    }
    if (userIdParam) {
      const parsed = Number(userIdParam);
      if (!Number.isNaN(parsed) && parsed > 0) {
        this.form.controls.userId.setValue(parsed);
      }
    }
  }

  get userIdControl() {
    return this.form.controls.userId;
  }

  get codeControl() {
    return this.form.controls.code;
  }

  submit() {
    if (this.isSubmitting()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { userId, code } = this.form.getRawValue();

    this.isSubmitting.set(true);

    this.auth
      .verifyEmail(Number(userId), code.trim())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          if (response.token && response.user) {
            this.auth.applyVerifiedSession(response.token, response.user, response.tenant_slug || null, true);
            this.toast.showSuccess('Correo verificado correctamente', '¡Bienvenido!');
            setTimeout(() => this.router.navigateByUrl('/tenants/create'), 1500);
            return;
          }
          this.toast.showSuccess(response.message || 'Correo verificado correctamente. Ya puedes iniciar sesión.', '¡Listo!');
        },
        error: (error) => {
          this.toast.showError(this.resolveErrorMessage(error), 'Error');
        }
      });
  }

  resendCode() {
    if (this.isResending()) {
      return;
    }

    const userId = this.form.controls.userId.value;
    if (!userId || userId < 1) {
      this.form.controls.userId.markAsTouched();
      this.toast.showWarning('Ingresa tu ID de usuario para reenviar el código.', 'Datos incompletos');
      return;
    }

    this.isResending.set(true);

    this.auth
      .resendVerification(Number(userId))
      .pipe(
        finalize(() => this.isResending.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.toast.showSuccess(response.message || 'Te enviamos un nuevo código de verificación.', 'Código enviado');
          if (response.email) {
            this.emailHint.set(response.email);
          }
        },
        error: (error) => {
          this.toast.showError(this.resolveErrorMessage(error), 'Error');
        }
      });
  }

  goToLogin() {
    this.router.navigateByUrl('/auth/login');
  }

  private resolveErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    const maybeHttpError = error as { error?: { message?: string }; message?: string } | null;
    return (
      maybeHttpError?.error?.message ||
      maybeHttpError?.message ||
      'No pudimos verificar el correo. Inténtalo de nuevo.'
    );
  }
}
