import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

import { SubjectService } from 'src/app/services';

const subjectsResolver: ResolveFn<any> =
  () => {
    return inject(SubjectService).getSubjects({ take: 1000, isActive: true }).then(resp => resp.data && resp.data.items);
  };

export default subjectsResolver;
