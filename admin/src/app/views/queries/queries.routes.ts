import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./queries-layout/queries-layout.component').then((m) => m.QueriesLayoutComponent),
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'list',
        loadComponent: () =>
          import('./list/list.component').then((m) => m.ListComponent),
        data: { title: 'Queries / List' },
      },
      {
        path: 'prompt',
        loadComponent: () =>
          import('./prompt/prompt.component').then((m) => m.PromptComponent),
        data: { title: 'Queries / ChatGPT Prompt' },
      },
    ],
  },
];
