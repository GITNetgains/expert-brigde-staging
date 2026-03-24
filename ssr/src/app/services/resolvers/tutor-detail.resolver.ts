import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { TutorService } from '../tutor.service';

const tutorDetailResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot) => {
  const tutorService = inject(TutorService);
  const router = inject(Router);

  const username = route.params['username'];

  return tutorService.findOne(username)
    .then((resp: any) => {
      const tutor = resp?.data || resp;

      // If no tutor data, behave like 404
      if (!tutor || !tutor._id) {
        router.navigate(['pages/404-not-found']);
        return;
      }

      return tutor;
    })
    .catch((err: any) => {
      if (err?.data?.code === '404') {
        router.navigate(['pages/404-not-found']);
      } else {
        router.navigate(['pages/error', err?.data?.code || '500']);
      }
    });
};

export default tutorDetailResolver;
