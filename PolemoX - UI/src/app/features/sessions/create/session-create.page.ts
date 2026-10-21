import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CreateSessionRequest,
  SESSION_INTERVAL_LABEL,
  SessionInterval,
  SessionVisibility,
} from '../../../core/models/session.model';
import { problemMessage } from '../../../core/models/problem-detail.model';
import { SessionService } from '../../../core/services/session.service';

const INTERVALS: SessionInterval[] = ['ONE_HOUR', 'ONE_DAY', 'THREE_DAY', 'SEVEN_DAY', 'THIRTY_DAY'];

const VISIBILITY_OPTIONS: { id: SessionVisibility; label: string; blurb: string }[] = [
  { id: 'PRIVATE', label: 'Private', blurb: 'Invite-only, or share the join code' },
  { id: 'PUBLIC', label: 'Public', blurb: 'Listed on the open board for anyone to join' },
];

@Component({
  selector: 'app-session-create-page',
  host: { class: 'mx-auto block w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8' },
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './session-create.page.html',
})
export class SessionCreatePage {
  private readonly fb = inject(FormBuilder);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly intervals = INTERVALS;
  protected readonly intervalLabels = SESSION_INTERVAL_LABEL;
  protected readonly visibilityOptions = VISIBILITY_OPTIONS;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    interval: ['ONE_DAY' as SessionInterval, Validators.required],
    // Mirrors the backend default: a lobby is private until its creator opts into listing it.
    visibility: ['PRIVATE' as SessionVisibility, Validators.required],
    maxParticipants: [5, [Validators.required, Validators.min(2), Validators.max(50)]],
    startingBalance: [100000, [Validators.required, Validators.min(1)]],
  });

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const request: CreateSessionRequest = {
      name: raw.name,
      interval: raw.interval,
      visibility: raw.visibility,
      maxParticipants: raw.maxParticipants,
      startingBalance: raw.startingBalance,
      // null = "as soon as the minimum headcount has joined" — see SessionService on the backend.
      startAt: null,
    };

    this.sessionService.create(request).subscribe({
      next: (session) => this.router.navigate(['/sessions', session.id]),
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(problemMessage(err, 'Could not create the session.'));
      },
    });
  }
}
