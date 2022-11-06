import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidemenuComponent } from './sidemenu/sidemenu.component';
import { IonicModule } from '@ionic/angular';
import { AppRoutingModule } from '../app-routing.module';



@NgModule({
  declarations: [
    SidemenuComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    AppRoutingModule
  ],
  exports: [
    SidemenuComponent
  ]
})
export class SharedModule { }
