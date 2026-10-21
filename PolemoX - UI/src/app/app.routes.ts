import { Routes } from '@angular/router';
import { authGuard, authRedirectGuard } from './core/guards/auth.guard';

/**
 * Every route renders inside `AppChrome`, signed in or not — there is no separate marketing shell.
 * Authentication changes what the chrome offers, never which frame you're in.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/app-chrome/app-chrome').then((m) => m.AppChrome),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'explore',
        loadComponent: () => import('./features/explore/explore.page').then((m) => m.ExplorePage),
      },
      {
        path: 'rankings',
        loadComponent: () => import('./features/rankings/rankings.page').then((m) => m.RankingsPage),
      },
      {
        path: 'market',
        loadComponent: () => import('./features/market/market.page').then((m) => m.MarketPage),
      },
      {
        path: 'traders/:username',
        loadComponent: () =>
          import('./features/traders/trader-profile.page').then((m) => m.TraderProfilePage),
      },
      {
        path: 'sessions/:id',
        loadComponent: () =>
          import('./features/sessions/detail/session-detail.page').then((m) => m.SessionDetailPage),
      },

      // Gated: the guard opens the sign-in overlay rather than routing to a login page.
      {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'sessions/new',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/sessions/create/session-create.page').then((m) => m.SessionCreatePage),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage),
      },

      // Legacy auth URLs now resolve to the overlay over the home page.
      { path: 'login', canActivate: [authRedirectGuard('login')], children: [] },
      { path: 'register', canActivate: [authRedirectGuard('register')], children: [] },

      { path: '**', redirectTo: '' },
    ],
  },
];
