import { Pipe, PipeTransform } from '@angular/core';
import { ParticipantView } from '../../core/models/session.model';

@Pipe({ name: 'sortByRank' })
export class SortByRankPipe implements PipeTransform {
  transform(participants: ParticipantView[]): ParticipantView[] {
    return [...participants].sort((a, b) => (a.finalRank ?? Infinity) - (b.finalRank ?? Infinity));
  }
}
