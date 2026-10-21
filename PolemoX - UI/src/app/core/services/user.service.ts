import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserSummary, UserView } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly http: HttpClient) {}

  me(): Observable<UserView> {
    return this.http.get<UserView>(`${environment.apiBaseUrl}/users/me`);
  }

  search(usernamePrefix: string): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${environment.apiBaseUrl}/users/search`, {
      params: { q: usernamePrefix },
    });
  }
}
