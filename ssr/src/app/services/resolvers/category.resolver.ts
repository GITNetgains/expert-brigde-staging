import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

import { CategoryService } from 'src/app/services';

const categoriesResolver: ResolveFn<any> =
  () => {
    return inject(CategoryService).getCategories({ take: 99, isActive: true, sort: 'ordering', sortType: 'asc' }).then(resp => resp.data && resp.data.items);
  };

export default categoriesResolver;
