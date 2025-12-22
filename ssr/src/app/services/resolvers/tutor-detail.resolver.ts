import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { TutorService } from '../tutor.service';


const tutorDetailResolver: ResolveFn<any> =
  (route: ActivatedRouteSnapshot) => {
    return inject(TutorService).findOne(route.params['username'])
      .then(resp => resp.data)
      .catch(err => {
        if (err.data.code == '404') inject(Router).navigate(['pages/404-not-found']);
        else {
          inject(Router).navigate(['pages/error', err.data.code]);
        }
      });
  };

export default tutorDetailResolver;
