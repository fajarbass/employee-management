import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { take, map, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})

export class AuthGuard implements CanActivate 
{
  constructor
  (
    private auth: AuthService,
    private router: Router,
    private alertCtrl: AlertController
  )
  {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree 
    {
      return this.auth.usr$.pipe
      (
        take(1),
        map(user => user?.hr ? true : false),
        tap(async (isLoggedIn) => 
          {
            if(!isLoggedIn)
            {
              const alert = await this.alertCtrl.create({
                header: 'Perhatian!',
                message: 'Untuk mengakses halaman ini silahkan login terlebih dahulu!',
                buttons: [
                  {
                    text: 'Ok',
                    role: 'cancel',
                    id: 'cancel-button'
                  },
                ]
              });

              await alert.present();
              this.router.navigate(['/login']);
              return false;
            }

            return true;
          })
      );
    }
  
}
