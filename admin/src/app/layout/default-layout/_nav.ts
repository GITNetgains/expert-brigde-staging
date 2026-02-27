import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    iconComponent: { name: 'cil-speedometer' },
    badge: {
      color: 'info',
      text: 'NEW',
    },
  },

  {
    title: true,
    name: 'Theme',
  },
  {
    name: 'Experts',
    url: '/tutor',
    iconComponent: { name: 'cil-user' },
    children: [
      {
        name: 'All experts',
        url: '/tutor/list',
        icon: 'nav-icon-bullet',
      },
      {
        name: 'Create new',
        url: '/tutor/create',
        icon: 'nav-icon-bullet',
      },
    ],
  },
  {
    name: 'Clients',
    url: '/users',
    iconComponent: { name: 'cil-education' },
    children: [
      {
        name: 'All clients',
        url: '/users/list',
        icon: 'nav-icon-bullet',
      },
      {
        name: 'Create new',
        url: '/users/create',
        icon: 'nav-icon-bullet',
      },
    ],
  },
  {
    name: 'Queries',
    url: '/queries/list',
    iconComponent: { name: 'cil-comment-bubble' },
  },
  {
    name: 'Appointments',
    url: '/appointment',
    iconComponent: { name: 'cil-calendar' },
    children: [
      {
        name: 'All Appointments',
        url: '/appointment/list',
        icon: 'nav-icon-bullet',
      },
    ],
  },
  {
    name: 'Filters',
    url: '/filter',
    iconComponent: { name: 'cil-filter' },
    children: [
      {
        name: 'Grade',
        url: '/grade',
        icon: 'nav-icon-bullet',
        children: [
          {
            name: 'All Grade',
            url: '/grade/list',
          },
          {
            name: 'Create new',
            url: '/grade/create',
          },
        ],
      },
      {
        name: 'Category',
        url: '/category',
        icon: 'nav-icon-bullet',
        children: [
          {
            name: 'All Category',
            url: '/category/list',
          },
          {
            name: 'Create new',
            url: '/category/create',
          },
        ],
      },

      {
        name: 'Subject',
        url: '/subject',
        icon: 'nav-icon-bullet',
        children: [
          {
            name: 'All Subject',
            url: '/subject/list',
          },
          {
            name: 'Create new',
            url: '/subject/create',
          },
        ],
      },
      {
        name: 'Topic',
        url: '/topic',
        icon: 'nav-icon-bullet',
        children: [
          {
            name: 'All Topic',
            url: '/topic/list',
          },
          {
            name: 'Create new',
            url: '/topic/create',
          },
        ],
      },
    ],
  },
  {
    name: 'Classes',
    url: '/classes',
    iconComponent: { name: 'cil-book' },
    children: [
      {
        name: 'Group Classes',
        url: '/webinar',
        icon: 'nav-icon-bullet',
        children: [
          {
            name: 'All Group Classes',
            url: '/webinar/list',
          },
          {
            name: 'Create new',
            url: '/webinar/create',
          },
        ],
      },
      // {
      //   name: 'Courses',
      //   url: '/courses',
      //   icon: 'nav-icon-bullet',
      //   children: [
      //     {
      //       name: 'All Courses',
      //       url: '/courses/list',
      //     },
      //     {
      //       name: 'Create new',
      //       url: '/courses/create',
      //     },
      //   ],
      // },
    ],
  },
  {
    name: 'Coupons',
    url: '/coupon',
    iconComponent: { name: 'cil-tag' },
    children: [
      {
        name: 'All Coupons',
        url: '/coupon/list',
      },
      {
        name: 'Create Coupon',
        url: '/coupon/create',
      },
    ],
  },

  {
    name: 'Pages',
    url: '/posts',
    iconComponent: { name: 'cil-star' },
    children: [
      {
        name: 'All Pages',
        url: '/posts/list',
        icon: 'nav-icon-bullet',
      },
      {
        name: 'Create Page',
        url: '/posts/create',
        icon: 'nav-icon-bullet',
      },
    ],
  },

  {
    name: 'Payment',
    url: '/refund',
    iconComponent: { name: 'cil-calculator' },
    children: [
      {
        name: 'Refund request',
        url: '/refund/refund-list',
        icon: 'nav-icon-bullet',
      },
      {
        name: 'Manage Payment',
        url: '/payment/transaction',
        icon: 'nav-icon-bullet',
      },
      {
        name: 'Payout Request',
        url: '/payout/request',
        icon: 'nav-icon-bullet',
      },
    ],
  },
  {
    name: 'Earnings',
    url: '/earnings',
    iconComponent: { name: 'cil-dollar' },
    children: [
      {
        name: 'Earning Stats',
        url: '/earnings/list',
        icon: 'nav-icon-bullet',
      },
    ],
  },
  {
    name: 'Settings',
    url: '/config',
    iconComponent: { name: 'cil-settings' },
    children: [
      {
        name: 'Config',
        url: '/config/list',
        icon: 'nav-icon-bullet',
      },
      {
        name: 'Email Templates',
        url: '/templates/list',
        icon: 'nav-icon-bullet',
      },
      {
        name: 'Testimonials',
        url: '/testimonials',
        icon: 'nav-icon-bullet',
        children: [
          {
            name: 'All Testimonials',
            url: '/testimonials/list',
          },
          {
            name: 'Create New',
            url: '/testimonials/create',
          },
        ],
      },
    ],
  },
  {
    name: 'Complaints',
    url: '/reports',
    iconComponent: { name: 'cil-comment-bubble' },
    children: [
      {
        name: 'Listing',
        url: '/reports/list',
        icon: 'nav-icon-bullet',
      },
    ],
  },
  {
    name: 'Contacts',
    url: '/contacts',
    iconComponent: { name: 'cil-envelope-closed' },
    children: [
      {
        name: 'Listing',
        url: '/contacts/list',
        icon: 'nav-icon-bullet',
      },
    ],
  },
  {
    name: 'Language',
    url: '/language',
    iconComponent: { name: 'cil-language' },
    children: [
      {
        name: 'All Language',
        url: '/language/list',
        icon: 'nav-icon-bullet',
      },
      {
        name: 'Text',
        url: '/language/text',
        icon: 'nav-icon-bullet',
      },
    ],
  },

  // {
  //   name: 'Typography',
  //   url: '/theme/typography',
  //   linkProps: { fragment: 'headings' },
  //   iconComponent: { name: 'cil-pencil' }
  // },
  // {
  //   name: 'Components',
  //   title: true
  // },
  // {
  //   name: 'Base',
  //   url: '/base',
  //   iconComponent: { name: 'cil-puzzle' },
  //   children: [
  //     {
  //       name: 'Accordion',
  //       url: '/accordion',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Breadcrumbs',
  //       url: '/base/breadcrumbs',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Cards',
  //       url: '/base/cards',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Carousel',
  //       url: '/base/carousel',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Collapse',
  //       url: '/base/collapse',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'List Group',
  //       url: '/base/list-group',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Navs & Tabs',
  //       url: '/base/navs',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Pagination',
  //       url: '/base/pagination',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Placeholder',
  //       url: '/base/placeholder',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Popovers',
  //       url: '/base/popovers',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Progress',
  //       url: '/base/progress',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Spinners',
  //       url: '/base/spinners',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Tables',
  //       url: '/base/tables',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Tabs',
  //       url: '/base/tabs',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Tooltips',
  //       url: '/base/tooltips',
  //       icon: 'nav-icon-bullet'
  //     }
  //   ]
  // },
  // {
  //   name: 'Buttons',
  //   url: '/buttons',
  //   iconComponent: { name: 'cil-cursor' },
  //   children: [
  //     {
  //       name: 'Buttons',
  //       url: '/buttons/buttons',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Button groups',
  //       url: '/buttons/button-groups',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Dropdowns',
  //       url: '/buttons/dropdowns',
  //       icon: 'nav-icon-bullet'
  //     }
  //   ]
  // },
  // {
  //   name: 'Forms',
  //   url: '/forms',
  //   iconComponent: { name: 'cil-notes' },
  //   children: [
  //     {
  //       name: 'Form Control',
  //       url: '/forms/form-control',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Select',
  //       url: '/forms/select',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Checks & Radios',
  //       url: '/forms/checks-radios',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Range',
  //       url: '/forms/range',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Input Group',
  //       url: '/forms/input-group',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Floating Labels',
  //       url: '/forms/floating-labels',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Layout',
  //       url: '/forms/layout',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Validation',
  //       url: '/forms/validation',
  //       icon: 'nav-icon-bullet'
  //     }
  //   ]
  // },
  // {
  //   name: 'Charts',
  //   iconComponent: { name: 'cil-chart-pie' },
  //   url: '/charts'
  // },
  // {
  //   name: 'Icons',
  //   iconComponent: { name: 'cil-star' },
  //   url: '/icons',
  //   children: [
  //     {
  //       name: 'CoreUI Free',
  //       url: '/icons/coreui-icons',
  //       icon: 'nav-icon-bullet',
  //       badge: {
  //         color: 'success',
  //         text: 'FREE'
  //       }
  //     },
  //     {
  //       name: 'CoreUI Flags',
  //       url: '/icons/flags',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'CoreUI Brands',
  //       url: '/icons/brands',
  //       icon: 'nav-icon-bullet'
  //     }
  //   ]
  // },
  // {
  //   name: 'Notifications',
  //   url: '/notifications',
  //   iconComponent: { name: 'cil-bell' },
  //   children: [
  //     {
  //       name: 'Alerts',
  //       url: '/notifications/alerts',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Badges',
  //       url: '/notifications/badges',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Modal',
  //       url: '/notifications/modal',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Toast',
  //       url: '/notifications/toasts',
  //       icon: 'nav-icon-bullet'
  //     }
  //   ]
  // },
  // {
  //   name: 'Widgets',
  //   url: '/widgets',
  //   iconComponent: { name: 'cil-calculator' },
  //   badge: {
  //     color: 'info',
  //     text: 'NEW'
  //   }
  // },
  // {
  //   title: true,
  //   name: 'Extras'
  // },
  // {
  //   name: 'Pages',
  //   url: '/login',
  //   iconComponent: { name: 'cil-star' },
  //   children: [
  //     {
  //       name: 'Login',
  //       url: '/login',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Register',
  //       url: '/register',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Error 404',
  //       url: '/404',
  //       icon: 'nav-icon-bullet'
  //     },
  //     {
  //       name: 'Error 500',
  //       url: '/500',
  //       icon: 'nav-icon-bullet'
  //     }
  //   ]
  // },
  // {
  //   title: true,
  //   name: 'Links',
  //   class: 'mt-auto'
  // },
  // {
  //   name: 'Docs',
  //   url: 'https://coreui.io/angular/docs/',
  //   iconComponent: { name: 'cil-description' },
  //   attributes: { target: '_blank' }
  // }
];
