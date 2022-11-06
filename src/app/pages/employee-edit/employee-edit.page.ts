import { Component, ViewChild, ElementRef } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { EmployeeService } from 'src/app/services/employee.service';

@Component({
  selector: 'app-employee-edit',
  templateUrl: './employee-edit.page.html',
  styleUrls: ['./employee-edit.page.scss'],
})
export class EmployeeEditPage {

  @ViewChild('fileChooser', {static:true}) fileChooserElementRef: ElementRef;
  @ViewChild('sgPopover') sgPopover;
  items: File[] = [];
  imgLoader: boolean = true;
  chgPhoto: boolean = false;
  img: any = null;

  empSubs:Subscription;
  employeeId:string;
  firstName:string;
  lastName:string;
  birthDate:number;
  username:string;
  email:string;
  basicSalary:number;
  basicSalaryinRp:string;
  salaryEdit: boolean;
  status:string;
  group:string;
  groups:any[] = [
    {'groupId': 'g001', 'groupName': 'Group A' },
    {'groupId': 'g002', 'groupName': 'Group B' },
    {'groupId': 'g003', 'groupName': 'Group C' },
    {'groupId': 'g004', 'groupName': 'Group D' },
    {'groupId': 'g005', 'groupName': 'Group E' },
    {'groupId': 'g006', 'groupName': 'Group F' },
    {'groupId': 'g007', 'groupName': 'Group G' },
    {'groupId': 'g008', 'groupName': 'Group H' },
    {'groupId': 'g009', 'groupName': 'Group I' },
    {'groupId': 'g010', 'groupName': 'Group J' }
  ];
  searchGroupTerm:string;
  sgPopIsOpen: boolean = false;
  description:string;
  submited: boolean = false;

  today = new Date(Date.now()).toISOString().split('T')[0];
  strgSubs:Subscription;

  constructor
  (
    private route: ActivatedRoute,
    private empSrvc: EmployeeService,
    private loadingCtrl: LoadingController,
    private storage: AngularFireStorage,
    private toastr: ToastController,
    private router: Router,
    
  ) { }

  ionViewWillEnter()
  {
    this.listenerInputChange();
    this.employeeId = this.route.snapshot.params['employeeId'];
    if(this.employeeId) this.loadEmployee(); console.log(this.employeeId);
  }

  loadEmployee()
  {
    this.empSubs = this.empSrvc.getEmployee(this.employeeId).subscribe((res)=>
    {
      this.firstName = res.firstName;
      this.lastName = res.lastName;
      this.username = res.username;
      this.email = res.email;
      this.birthDate = res.birthDate;
      this.basicSalary = res.basicSalary;
      this.convertToRp();
      this.status = res.status;
      this.group = res.group;
      this.description = res.description.toString();
      if(res.photo !== '-') this.img = res.photo;
    });
  }

  private listenerInputChange() {
    const wireUpFileChooser = () => {
        const elementRef = this.fileChooserElementRef.nativeElement as HTMLInputElement;
        elementRef.addEventListener('change', (evt: any) => 
        {
            const files = evt.target.files as File[];
            for (let i = 0; i < files.length; i++) {
                this.items.push(files[i]);
                const reader = new FileReader();
                reader.readAsDataURL(files[i]);
                reader.onload = () => {
                  this.img = reader.result;
                  this.chgPhoto = true;
                }
            }
        }, false);
    };
    wireUpFileChooser();
  }

  async checkUsername()
  {
    if((await this.empSrvc.checkUsernameAvailablity(this.username)).exists())
    {
      this.toast('Username is already used by another employee', 'warning');
      this.username = null;
    }

  }

  async checkEmail()
  {
    if((await this.empSrvc.checkEmailAvailablity(this.email)).exists())
    {
      this.toast('Email is already used by another employee', 'warning');
      this.email = null;
    }

  }

  sgPop(e:Event)
  {
    this.sgPopover.event = e;
    this.sgPopIsOpen = true;
  }

  groupSearch()
  {
    if(this.searchGroupTerm != null)
    {
      return this.groups.filter((group:any) => 
      group?.groupName.toLocaleLowerCase().match(this.searchGroupTerm.toLocaleLowerCase())|| 
      group?.groupId.toLocaleLowerCase().match(this.searchGroupTerm.toLocaleLowerCase()));
    }else{
      return this.groups;
    }
  }

  selectGroup(group:any)
  {
    this.groups.find((g) => g.selected === true) ? this.groups.find((g) => g.selected === true).selected = false : console.log('no prev selected group');
    this.groups.find((g)=> g.groupId === group.groupId).selected = true;
    this.group = group.groupName;
    this.sgPopIsOpen = false;
    this.searchGroupTerm = null;
  }

  convertToRp()
  {
    this.basicSalaryinRp = this.basicSalary?.toLocaleString('id-ID', {style:'currency', currency:'IDR'});
    this.salaryEdit = false;
  }

  async uploadImage(empId:string)
  {
    return await new Promise((resolve, reject) => 
      {
        let fileRef = this.storage.ref(`employees/${empId}/img`);
        let uploadTask = fileRef.putString(this.img, 'data_url');
    
        uploadTask.task.on(
          "state_changed",
          (snapshot: any) => 
          {
            console.log(
              "snapshot progress " +
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            
          },
          error => 
          {
            reject(error);
          },
          async () => 
          {
            await uploadTask.task.snapshot.ref.getDownloadURL().then((urlImg)=> 
            {
              console.log(urlImg);
            });
            resolve(uploadTask.task.snapshot);
          }
        )
      });

  }

  async toast(message, status)
  {
    const toast = await this.toastr.create({
      message: message,
      position: 'top',
      color: status,
      duration: 2000
    });
    toast.present();
  }

  async save()
  {
    if(this.firstName && this.lastName && this.username && this.email && this.birthDate && this.basicSalary && this.status && this.group)
    {
      this.submited = true;
      
      const loading = await this.loadingCtrl.create({
        message: 'Saving..',
        spinner: 'crescent',
        showBackdrop: true
      });

      await loading.present();

      const data = 
      {
        'employeeId': this.employeeId,
        'firstName': this.firstName,
        'lastName': this.lastName,
        'username': this.username,
        'email': this.email,
        'birthDate': this.birthDate,
        'basicSalary': this.basicSalary,
        'status': this.status,
        'group': this.group,
        'description': this.description,
        'photo': '-',
        'createdAt': Date.now(),
      }

      this.empSrvc.updateEmployee(this.employeeId, data)
      .then(async ()=> {
        if(this.img)
        {
          await this.uploadImage(this.employeeId);
        }
      })
      .then(()=> 
      {
        if(this.img)
        {
          setTimeout(()=>
          {
            this.strgSubs = this.storage.ref(`employees/${this.employeeId}/c/img_1000x1000`).getDownloadURL()
            .subscribe(async(res)=>
            {
              await this.empSrvc.updateEmployee(this.employeeId, {'photo':res});
            });
          },10000);
        }
      })
      .then(()=> {
        loading.dismiss();
        this.router.navigate(['/employee']);
      })
      .catch((error)=> {
        loading.dismiss();
        this.toast(error.message, 'danger');
      });

    } else {
      this.toast('Field cannot be emptied!', 'warning');
    }
  }

  cancel()
  {
    this.router.navigate(['/employee']);
  }

  ionViewWillLeave()
  {
    if(this.empSubs) this.empSubs.unsubscribe();
  }

}
