import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { MarketPulseView } from '../../core/models/discovery.model';
import { DiscoveryService } from '../../core/services/discovery.service';
import { MarketCarousel } from '../home/market-carousel/market-carousel';
import { RightRail } from '../home/right-rail/right-rail';

/** Matches the server's public-board cache TTL. */
const REFRESH_MS = 30_000;

/** The watchlist the arena trades, with a chart per symbol. */
@Component({
  selector: 'app-market-page',
  imports: [MarketCarousel, RightRail],
  templateUrl: './market.page.html',
})
export class MarketPage implements OnInit {
  private readonly discovery = inject(DiscoveryService);

  protected readonly pulse = signal<MarketPulseView | null>(null);

  constructor() {
    const timer = setInterval(() => this.load(), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.discovery.market().subscribe({ next: (p) => this.pulse.set(p) });
  }
}
