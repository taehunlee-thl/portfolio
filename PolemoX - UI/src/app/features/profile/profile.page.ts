import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionView } from '../../core/models/session.model';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { LevelBadgeComponent } from '../../shared/ui/level-badge/level-badge';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge';

@Component({
  selector: 'app-profile-page',
  host: { class: 'mx-auto block w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8' },
  imports: [RouterLink, DatePipe, LevelBadgeComponent, StatusBadgeComponent],
  templateUrl: './profile.page.html',
})
export class ProfilePage implements OnInit {
  protected readonly sessions = signal<SessionView[]>([]);
  protected readonly loading = signal(true);

  protected readonly completedSessions = computed(() =>
    this.sessions()
      .filter((s) => s.status === 'COMPLETED')
      .sort((a, b) => new Date(b.endAt ?? 0).getTime() - new Date(a.endAt ?? 0).getTime()),
  );

  protected readonly battlesPlayed = computed(() => this.completedSessions().length);

  /** Cumulative XP needed to reach a level, mirroring LevelCalculator on the backend. */
  protected readonly nextLevelXp = computed(() => {
    const user = this.auth.currentUser();
    return user ? Math.ceil(100 * Math.pow(user.level, 1.5)) : 0;
  });

  constructor(
    protected readonly auth: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  ngOnInit(): void {
    this.sessionService.mine().subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
