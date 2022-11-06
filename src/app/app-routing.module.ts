import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'forgot-password',
    loadChildren: () => import('./pages/forgot-password/forgot-password.module').then( m => m.ForgotPasswordPageModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then( m => m.DashboardPageModule),
    canActivate:[AuthGuard]
  },
  {
    path: 'employee',
    loadChildren: () => import('./pages/employee/employee.module').then( m => m.EmployeePageModule),
    canActivate:[AuthGuard]
  },
  {
    path: 'employee/add',
    loadChildren: () => import('./pages/employee-add/employee-add.module').then( m => m.EmployeeAddPageModule),
    canActivate:[AuthGuard]
  },
  {
    path: 'employee/detail/:employeeId',
    loadChildren: () => import('./pages/employee-detail/employee-detail.module').then( m => m.EmployeeDetailPageModule),
    canActivate:[AuthGuard]
  },
  {
    path: 'employee/edit/:employeeId',
    loadChildren: () => import('./pages/employee-edit/employee-edit.module').then( m => m.EmployeeEditPageModule),
    canActivate:[AuthGuard]
  },
  {
    path: '**',
    loadChildren: () => import('./pages/page-not-found/page-not-found.module').then( m => m.PageNotFoundPageModule)
  },
 
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
