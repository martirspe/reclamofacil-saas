import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../core/auth/auth.service';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle.component';
import { ToastService } from '../../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ThemeToggleComponent],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Register implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly passwordValue = signal('');
  readonly showPasswordRequirements = signal(false);

  readonly hasMinLength = computed(() => this.passwordValue().length >= 8);
  readonly hasUppercase = computed(() => /[A-Z]/.test(this.passwordValue()));
  readonly hasLowercase = computed(() => /[a-z]/.test(this.passwordValue()));
  readonly hasSpecialChar = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(this.passwordValue()));
  readonly hasNumber = computed(() => /\d/.test(this.passwordValue()));

  readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/)
        ]
      ],
      confirmPassword: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]]
    },
    { validators: [this.passwordsMatchValidator] }
  );

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.router.navigateByUrl('/');
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

  get emailControl() {
    return this.form.controls.email;
  }

  get passwordControl() {
    return this.form.controls.password;
  }

  get confirmPasswordControl() {
    return this.form.controls.confirmPassword;
  }

  get termsControl() {
    return this.form.controls.terms;
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

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();

    this.isSubmitting.set(true);
    this.successMessage.set(null);

    this.auth
      .signup('', '', email.trim(), password)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.toast.showSuccess(
            'Cuenta creada correctamente. Verifica tu correo para continuar.',
            '¡Registro exitoso!'
          );
          this.router.navigate(['/auth/verify-email'], {
            queryParams: { userId: response.userId, email: response.email }
          });
        },
        error: (error) => {
          const message = this.resolveErrorMessage(error);
          this.toast.showError(message, 'Error al registrar');
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

  private resolveErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    const maybeHttpError = error as { error?: { message?: string }; message?: string } | null;
    return (
      maybeHttpError?.error?.message ||
      maybeHttpError?.message ||
      'No pudimos completar el registro. Inténtalo de nuevo.'
    );
  }

}
