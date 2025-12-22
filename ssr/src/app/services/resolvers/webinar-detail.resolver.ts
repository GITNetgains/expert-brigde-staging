import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { WebinarService } from '../webinar.service';


const webinarDetailResolver: ResolveFn<any> =
  (route: ActivatedRouteSnapshot) => {
    return inject(WebinarService).findOne(route.params['id'])
      .then(resp => resp.data)
      .catch(err => {
        if (err.data.code == '404') inject(Router).navigate(['pages/404-not-found']);
        else {
          inject(Router).navigate(['pages/error', err.data.code]);
        }
      });
  };

export default webinarDetailResolver;
