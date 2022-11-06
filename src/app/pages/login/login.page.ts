import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AngularFireDatabase } from '@angular/fire/compat/database';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {

  username:string;
  password:string;

  isTextFieldType?: boolean;

  uSubs:Subscription;

  constructor(
    public router: Router,
    private auth: AuthService,
    private db: AngularFireDatabase,
    private toastr: ToastController,
  ) {}

  togglePasswordFieldType()
  {
    this.isTextFieldType = !this.isTextFieldType;
  }

  async signIn()
  {
    var emailRegex = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/; 
    if(emailRegex.test(this.username))
    {
      this.username && this.password ? 
      this.auth.signIn(this.username, this.password)
      .catch((error)=> this.toast(error.message)) : 
      this.toast('Please enter your email/username & password!');
    }else{
      this.uSubs = this.db.list<any>(`users`, ref => ref.orderByChild('username').equalTo(this.username)).valueChanges()
      .subscribe((res)=>
      {
        if(res.length !== 0)
        {
          this.auth.signIn(res[0].email, this.password)
          .catch((error)=>
          {
            this.toast(error.message);
          });
        }else{
          this.toast('Username & password is not valid!');
        }
        
  
      });
    }

  } // end of signIn()

  forgot()
  {
    this.router.navigate(['/forgot-password']);
  }
    
  async toast(message:string) 
  {
    const toast = await this.toastr.create({
      message: message,
      position: 'top',
      color: "secondary",
      duration: 3000
    });
    toast.present();
  }


  ionViewWillLeave()
  {
    if(this.uSubs) this.uSubs.unsubscribe();
  }


}
