import { Component } from '@angular/core';
import { RankingsBoard } from '../discovery/rankings-board/rankings-board';
import { RightRail } from '../home/right-rail/right-rail';

/** Standings in full, with the same rail as the rest of the app for continuity. */
@Component({
  selector: 'app-rankings-page',
  imports: [RankingsBoard, RightRail],
  templateUrl: './rankings.page.html',
})
export class RankingsPage {}
