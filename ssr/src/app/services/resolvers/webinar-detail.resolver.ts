import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router } from '@angular/router';
import { WebinarService } from '../webinar.service';
import { AuthService } from '../auth.service';

const webinarDetailResolver: ResolveFn<any> = (route: ActivatedRouteSnapshot) => {
  const webinarService = inject(WebinarService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const id = route.params['id'];

  return Promise.all([authService.getCurrentUser(), webinarService.findOne(id)])
    .then(([user, resp]) => {
      const webinar = resp?.data || resp;

      if (!webinar || !webinar._id) {
        router.navigate(['pages/404-not-found']);
        return;
      }

      const anyUser: any = user as any;
      const isAdmin = anyUser?.role === 'admin';
      const isTutor = anyUser?.type === 'tutor';
      const isStudent = anyUser?.role === 'user' || anyUser?.type === 'student';

      const webinarTutorId =
        (webinar.tutorId && (webinar.tutorId._id || webinar.tutorId)) || null;

      // Admins can view all
      if (isAdmin) {
        return webinar;
      }

      // Tutors should not access the public group session detail page at all
      if (isTutor) {
        router.navigate(['/pages/error/NO_ACCESS']);
        return;
      }

      // Students can view group session detail (access already constrained by where links appear)
      if (isStudent) {
        return webinar;
      }

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

export default webinarDetailResolver;
