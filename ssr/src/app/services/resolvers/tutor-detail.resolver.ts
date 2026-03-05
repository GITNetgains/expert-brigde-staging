import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { TutorService } from '../tutor.service';
import { AuthService } from '../auth.service';

const tutorDetailResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot) => {
  const tutorService = inject(TutorService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const username = route.params['username'];

  return Promise.all([authService.getCurrentUser(), tutorService.findOne(username)])
    .then(([user, resp]) => {
      const tutor = resp?.data || resp;

      // If no tutor data, behave like 404
      if (!tutor || !tutor._id) {
        router.navigate(['pages/404-not-found']);
        return;
      }

      const anyUser: any = user as any;
      const isAdmin = anyUser?.role === 'admin';
      const isTutor = anyUser?.type === 'tutor';
      const isStudent = anyUser?.role === 'user' || anyUser?.type === 'student';

      // Tutors should not access public expert detail pages at all
      if (isTutor) {
        router.navigate(['/pages/error/NO_ACCESS']);
        return;
      }

      // Admins can view all tutors
      if (isAdmin) {
        return tutor;
      }

      // Students can view tutor detail (access already constrained by where links appear)
      if (isStudent) {
        return tutor;
      }

      // Any other role: deny access
      router.navigate(['pages/404-not-found']);
      return;
    })
    .catch((err) => {
      if (err?.data?.code === '404') {
        router.navigate(['pages/404-not-found']);
      } else {
        router.navigate(['pages/error', err?.data?.code || '500']);
      }
    });
};

export default tutorDetailResolver;
