import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../core/auth/auth.service';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle.component';
import { ToastService } from '../../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ThemeToggleComponent],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPassword implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly token = signal<string | null>(null);
  readonly userId = signal<number | null>(null);
  readonly passwordValue = signal('');
  readonly showPasswordRequirements = signal(false);

  readonly hasMinLength = computed(() => this.passwordValue().length >= 8);
  readonly hasUppercase = computed(() => /[A-Z]/.test(this.passwordValue()));
  readonly hasLowercase = computed(() => /[a-z]/.test(this.passwordValue()));
  readonly hasSpecialChar = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(this.passwordValue()));
  readonly hasNumber = computed(() => /\d/.test(this.passwordValue()));

  readonly form = this.fb.nonNullable.group(
    {
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/)
        ]
      ],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: [this.passwordsMatchValidator] }
  );

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    const userId = this.route.snapshot.queryParamMap.get('userId');
    if (token) {
      this.token.set(token);
    }
    if (userId) {
      const parsed = Number(userId);
      if (!Number.isNaN(parsed) && parsed > 0) {
        this.userId.set(parsed);
      }
    }

    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.passwordValue.set(value || '');
        if (value && value.length > 0) {
          this.showPasswordRequirements.set(true);
        }
      });
  }

  get passwordControl() {
    return this.form.controls.password;
  }

  get confirmPasswordControl() {
    return this.form.controls.confirmPassword;
  }

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  submit() {
    if (this.isSubmitting()) {
      return;
    }

    if (!this.token() || !this.userId()) {
      const message = 'El enlace de restablecimiento es inválido o expiró.';
      this.toast.showError(message, 'Enlace inválido');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password } = this.form.getRawValue();

    this.isSubmitting.set(true);
    this.successMessage.set(null);

    this.auth
      .resetPassword(this.userId()!, this.token()!, password)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          const message = response.message || 'Contraseña actualizada. Ya puedes iniciar sesión.';
          this.successMessage.set(message);
          this.toast.showSuccess(message, '¡Contraseña actualizada!');
          setTimeout(() => this.router.navigateByUrl('/auth/login'), 2000);
        },
        error: (error) => {
          const maybeHttpError = error as { error?: { message?: string }; message?: string } | null;
          const message = 
            maybeHttpError?.error?.message ||
            maybeHttpError?.message ||
            'No pudimos restablecer la contraseña. Inténtalo de nuevo.';
          this.toast.showError(message, 'Error al restablecer');
        }
      });
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value as string | undefined;
    const confirmPassword = control.get('confirmPassword')?.value as string | undefined;
    if (!password || !confirmPassword) {
      return null;
    }
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }
}
