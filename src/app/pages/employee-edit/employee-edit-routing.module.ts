import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EmployeeEditPage } from './employee-edit.page';

const routes: Routes = [
  {
    path: '',
    component: EmployeeEditPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmployeeEditPageRoutingModule {}
