import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./languages/languages.component').then(
        (m) => m.LanguagesListComponent
      ),
    data: {
      title: `Language / List`,
    },
  },
  {
    path: 'text',
    loadComponent: () =>
      import('./text/text.component').then((m) => m.TextComponent),
    data: {
      title: `Language / Text`,
    },
  },
  {
    path: 'translation/:lang',
    loadComponent: () =>
      import('./translation/translation.component').then(
        (m) => m.TranslationComponent
      ),
    data: {
      title: `Language / Text`,
    },
  },
];
