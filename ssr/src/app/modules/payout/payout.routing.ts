import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {
  AccountCreateComponent,
  ListingAccountsComponent,
  ListingRequestComponent,
  AccountUpdateComponent,
  CreateRequestPayoutComponent
} from './components';
import { AccountResolver } from 'src/app/services/resolvers/account.resolver';

const routes: Routes = [
  {
    path: '',
    component: ListingRequestComponent
  },
  {
    path: 'request',
    component: ListingRequestComponent,
    resolve: {
      account: AccountResolver
    }
  },
  { path: 'request/create', component: CreateRequestPayoutComponent },
  {
    path: 'account',
    component: ListingAccountsComponent
  },
  {
    path: 'account/create',
    component: AccountCreateComponent,
    resolve: {
      account: AccountResolver
    }
  },
  { path: 'account/update/:id', component: AccountUpdateComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PayoutRoutingModule { }
