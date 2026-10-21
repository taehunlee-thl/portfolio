import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { problemMessage } from '../../../core/models/problem-detail.model';
import { AuthModalService } from '../../../core/services/auth-modal.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Sign-in / sign-up as an overlay rather than a page.
 *
 * <p>Rendered once by the app chrome and driven entirely by {@link AuthModalService}, so any
 * component can demand authentication without knowing anything about routing. Both forms live
 * here and share one submit path; switching mode swaps validators rather than navigating.
 */
@Component({
  selector: 'app-auth-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './auth-modal.html',
})
export class AuthModal {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  protected readonly modal = inject(AuthModalService);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly loginForm = this.fb.nonNullable.group({
    usernameOrEmail: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly registerForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(64)]],
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(32),
        Validators.pattern(/^[a-zA-Z0-9_]+$/),
      ],
    ],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected readonly isLogin = computed(() => this.modal.mode() === 'login');

  constructor() {
    // Clear stale state whenever the overlay opens, so a previous failure doesn't greet the
    // next person who opens it.
    effect(() => {
      if (this.modal.isOpen()) {
        this.errorMessage.set(null);
        this.submitting.set(false);
      }
    });
  }

  protected submit(): void {
    if (this.submitting()) return;

    const form = this.isLogin() ? this.loginForm : this.registerForm;
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const request$ = this.isLogin()
      ? this.auth.login(this.loginForm.getRawValue())
      : this.auth.register(this.registerForm.getRawValue());

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.loginForm.reset();
        this.registerForm.reset();
        this.modal.completed();
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(
          problemMessage(err, this.isLogin() ? 'Could not sign in.' : 'Could not create your account.'),
        );
      },
    });
  }

  /** Escape and backdrop clicks dismiss, but never mid-request — that would strand the call. */
  protected dismiss(): void {
    if (!this.submitting()) {
      this.modal.close();
    }
  }
}
