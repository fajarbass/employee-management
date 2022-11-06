import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-sidemenu',
  templateUrl: './sidemenu.component.html',
  styleUrls: ['./sidemenu.component.scss'],
  providers: [AuthService]
})
export class SidemenuComponent implements OnInit, OnDestroy
{
  loggedIn:boolean = false;
  usr: Observable<any>;
  userSubs:Subscription;


  constructor(
    private auth: AuthService,
    private toastr: ToastController,
    private router: Router,

  ) 
  {}

  ngOnInit() 
  {
    this.authCheck();
  }

  async authCheck()
  {
    this.userSubs = this.auth.usr$.subscribe(res => 
    {
      if(res)
      {
        this.loggedIn = true;
        this.usr = this.auth.getEmployee(res.uid);

        if(this.router.url == '/login')
        {
          this.router.navigate(['/dashboard']);
        }

      } else {
        this.usr = null;
        this.loggedIn = false;
      }
    });
  }

  profile()
  {
    this.router.navigate(['/profile']);
  }

  logout()
  {
    this.auth.signOut();
  }

  async toast(msg:string, stat:string)
  {
    const toast = await this.toastr.create({
      message: msg,
      position: 'top',
      color: stat,
      duration:5000
    });

    toast.present();
  }

  ngOnDestroy(): void {
    if(this.userSubs) this.userSubs.unsubscribe();
  }

  

}
