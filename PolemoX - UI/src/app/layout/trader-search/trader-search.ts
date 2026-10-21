import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { UserSummary } from '../../core/models/user.model';
import { DiscoveryService } from '../../core/services/discovery.service';
import { LevelBadgeComponent } from '../../shared/ui/level-badge/level-badge';

/**
 * Trader lookup in the top bar.
 *
 * <p>Debounced and switch-mapped: typing fires one request per pause rather than per keystroke,
 * and `switchMap` cancels an in-flight search when a newer one starts, so a slow early response
 * can't overwrite the results for what the user has since typed.
 */
@Component({
  selector: 'app-trader-search',
  imports: [FormsModule, LevelBadgeComponent],
  templateUrl: './trader-search.html',
})
export class TraderSearch {
  private readonly discovery = inject(DiscoveryService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly query = signal('');
  protected readonly results = signal<UserSummary[]>([]);
  protected readonly open = signal(false);
  protected readonly searching = signal(false);

  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) => {
          this.searching.set(true);
          return this.discovery.searchTraders(q);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (users) => {
          this.results.set(users);
          this.searching.set(false);
        },
        error: () => {
          this.results.set([]);
          this.searching.set(false);
        },
      });
  }

  protected onInput(value: string): void {
    this.query.set(value);
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      this.results.set([]);
      this.open.set(false);
      return;
    }
    this.open.set(true);
    this.search$.next(trimmed);
  }

  protected select(user: UserSummary): void {
    this.reset();
    this.router.navigate(['/traders', user.username]);
  }

  protected onBlur(): void {
    // Delayed so a click on a result registers before the list is torn down.
    setTimeout(() => this.open.set(false), 150);
  }

  protected onFocus(): void {
    if (this.results().length > 0) {
      this.open.set(true);
    }
  }

  private reset(): void {
    this.query.set('');
    this.results.set([]);
    this.open.set(false);
    this.inputRef()?.nativeElement.blur();
  }
}
