import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { LoadingController, ToastController } from '@ionic/angular';
import * as firebase from 'firebase/compat/app';
import { AngularFireAuth } from '@angular/fire/compat/auth';


@Injectable({
  providedIn: 'root'
})

export class AuthService {

  usr$?: Observable<any>;
  usr?: any;

  constructor
  (
    private afauth: AngularFireAuth,
    private db: AngularFireDatabase,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastr: ToastController,
  ) 
  { 
    this.usr$ = this.afauth.authState
    .pipe(
      switchMap(user => 
        {          
          if(user)
          {
            return this.db.object<any>(`users/${user.uid}`).valueChanges();
          } else {
            return of(null);
          }
        })
    )
  } // end of constructor

  getEmployee(uid:string)
  {
    return this.db.object<any>(`employees/${uid}`).valueChanges();
  }

  async signIn(email, pass)
  {
    const loading = await this.loadingCtrl.create({
      message: 'authenticating..',
      spinner: 'crescent',
      showBackdrop: true
    });

    await loading.present();


    this.afauth.setPersistence(firebase.default.auth.Auth.Persistence.LOCAL).then(()=> {
      this.afauth.signInWithEmailAndPassword(email, pass).then((data) => 
      {        
        if(!data.user.emailVerified)
        {
          loading.dismiss();
          this.toast('Please verify your email address!');
          this.afauth.signOut();
        } else {
          setTimeout(()=> {
            loading.dismiss();
            this.router.navigate(['/dashboard']);
          }, 1000)
        }
      })
      .catch(error => {
        loading.dismiss();
        this.toast(error.message);
      });
    })
    .catch(error => {
      loading.dismiss();
      this.toast(error.message);
    });

   
  }

  async signOut()
  {
    const loading = await this.loadingCtrl.create({
      spinner: 'crescent',
      showBackdrop: true
    });

    await loading.present();

    this.afauth.signOut().then(()=> {
      loading.dismiss();
      this.router.navigate(['/']);
    });
  }

  async toast(message:string) {
    const toast = await this.toastr.create({
      message: message,
      position: 'top',
      color: 'secondary',
      duration: 3000
    });
    toast.present();
  }

}
