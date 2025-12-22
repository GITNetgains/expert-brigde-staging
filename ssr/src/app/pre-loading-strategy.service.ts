import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CustomPreLoadingStrategyService implements PreloadingStrategy {
  preload(route: Route, fn: () => Observable<any>): Observable<any> {

    const loadRoute = (delay: number) => delay > 0 ? timer(delay).pipe(map(() => fn())) : fn();

    if (route.data && route.data['preload']) {
      const duration = route.data['loadAfter'] ? route.data['loadAfter'] : 0;
      return loadRoute(duration);
    } else {
      return of(null);
    }
  }
}