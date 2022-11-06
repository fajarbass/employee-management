import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage implements OnInit {

  email:string;

  constructor
  (
    private afauth: AngularFireAuth,
    private toastr: ToastController,
    private loadingCtrl: LoadingController,
    private router : Router
  ) { }

  ngOnInit() {
  }

  async reset()
  {

    if(this.email)
    {
      const loading = await this.loadingCtrl.create(
        {
          spinner: 'crescent',
          showBackdrop: true
        }
      );
  
      await loading.present();

      this.afauth.sendPasswordResetEmail(this.email).then(async success => 
      {
        await this.toast( 'Sending password reset link to your email..', 'success');
      }).then(async success=> 
      {
        await this.toast('Please check your inbox!', 'success');
      }).then(async success=>
      {
        loading.dismiss();
        await this.router.navigate(['/login']);
      })
      .catch(error =>
      {
        this.toast(error.message, 'danger');
        loading.dismiss();
      });
    } else {
      this.toast('Please enter your email address!', 'danger');
    }
  }

  async toast(message, status) {
    const toast = await this.toastr.create({
      message: message,
      position: 'top',
      color: status,
      duration: 2000
    });
    toast.present();
  }

}
