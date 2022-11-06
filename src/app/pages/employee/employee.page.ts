import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, PopoverController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { EmployeeService } from '../../services/employee.service';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';


@Component({
  selector: 'app-employee',
  templateUrl: './employee.page.html',
  styleUrls: ['./employee.page.scss'],
  providers: [EmployeeService]
})
export class EmployeePage {

  @ViewChild(DatatableComponent) table: DatatableComponent;

  ColumnMode = ColumnMode;
  searchTerm: string;
  employees:any[];
  lastIndex: number = 10;
  empSUbs:Subscription;
  SelectionType = SelectionType;
  constructor
  (
    private empSrvc: EmployeeService,
    private popCtrl: PopoverController,
    private alertCtrl: AlertController,
    private router: Router,
    private loadingCtrl: LoadingController
  ) {}

  ionViewWillEnter()
  {
    this.loadEmployees();
  }

  loadEmployees()
  {
    this.empSUbs = this.empSrvc.getAllEmployees().subscribe((res)=>
    {
      this.employees = res;
    });
  }

  empSearch()
  {
    if(this.searchTerm != null)
    {
      return this.employees.filter((emp:any) => 
      emp?.firstName.toLocaleLowerCase().match(this.searchTerm.toLocaleLowerCase())|| 
      emp?.lastName.toLocaleLowerCase().match(this.searchTerm.toLocaleLowerCase()) || 
      emp?.username.toLocaleLowerCase().match(this.searchTerm.toLocaleLowerCase()) ||
      emp?.email.toLocaleLowerCase().match(this.searchTerm.toLocaleLowerCase()) ||
      emp?.status.toLocaleLowerCase().match(this.searchTerm.toLocaleLowerCase()) ||
      emp?.basicSalary.toString().toLocaleLowerCase().match(this.searchTerm.toString().toLocaleLowerCase())
      );
    }else{
      return this.employees;
    }
  }

  empDetail(e:any)
  {
    console.log(e);
  }

  async ctxMenu(e:any)
  {

    // const popover = await this.popCtrl.create({
      
    //   component: PopoverComponent,
    //   event: e,
    // });

    // await popover.present();

    // const { role } = await popover.onDidDismiss();
    // this.roleMsg = `Popover dismissed with role: ${role}`;

    console.log(e);
    e.event.preventDefault();
    e.event.stopPropagation();
  }

  onTrigger(e:any)
  {
    if(e.type === "dblclick")
    {
      this.router.navigate(['employee/detail', e.row.key]);
    }

  }

  async editButtonAlert(row:any)
  {
    const alert = await this.alertCtrl.create({
      header: 'Attention!',
      message: 'Are you sure you want to edit <b>'+row.firstName+' '+row.lastName+'</b> data?',
      cssClass: 'editAlert',
      backdropDismiss: false,
      buttons: [
        {
          text: 'Yes',
          id: 'confirm-button',
          handler: () => {
            this.router.navigate(['employee/edit', row.key]);
          }
        },
        {
          text: 'No',
          role: 'cancel',
          id: 'cancel-button'
        },
      ]
    });

    await alert.present();
  }

  async deleteButtonAlert(row:any)
  {
    const alert = await this.alertCtrl.create({
      header: 'Warning!',
      message: 'Are you sure you want to delete <b>'+row.firstName+' '+row.lastName+'</b> data?',
      cssClass:'deleteAlert',
      buttons: [
        {
          text: 'Yes',
          id: 'confirm-button',
          handler: () => {
            this.deleteEmploye(row.key);
          }
        },
        {
          text: 'No',
          role: 'cancel',
          id: 'cancel-button'
        },
      ]
    });

    await alert.present();
  }


  async deleteEmploye(empId:string)
  {
    const loading = await this.loadingCtrl.create({
      message: 'Deleting employee data..',
      spinner: 'crescent',
      showBackdrop: true
    });

    await loading.present();

    await this.empSrvc.deleteEmployee(empId)
    .then(()=> {loading.dismiss(); this.router.navigate(['/employee'])})
    .catch((error) => {loading.dismiss(); console.log(error.message)});
  }

}

