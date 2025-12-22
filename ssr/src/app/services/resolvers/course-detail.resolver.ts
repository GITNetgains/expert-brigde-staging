import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { CourseService } from '../course.service';


const courseDetailResolver: ResolveFn<any> =
  (route: ActivatedRouteSnapshot) => {
    return inject(CourseService).findOne(route.params['id'])
      .then(resp => resp.data)
      .catch(err => {
        if (err.data.code == '404') inject(Router).navigate(['pages/404-not-found']);
        else {
          inject(Router).navigate(['pages/error', err.data.code]);
        }
      });
  };

export default courseDetailResolver;
