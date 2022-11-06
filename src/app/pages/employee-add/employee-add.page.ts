import { Component, ElementRef, ViewChild } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Router } from '@angular/router';
import { EmployeeService } from 'src/app/services/employee.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-employee-add',
  templateUrl: './employee-add.page.html',
  styleUrls: ['./employee-add.page.scss'],
  providers: [EmployeeService]
})
export class EmployeeAddPage {

  @ViewChild('fileChooser', {static:true}) fileChooserElementRef: ElementRef;
  @ViewChild('sgPopover') sgPopover;
  items: File[] = [];
  imgLoader: boolean = true;
  chgPhoto: boolean = false;
  img: any = null;

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
    private empService: EmployeeService,
    private loadingCtrl: LoadingController,
    private storage: AngularFireStorage,
    private toastr: ToastController,
    private router: Router,
  ) { }

  ionViewWillEnter()
  {
    this.listenerInputChange();
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
    if((await this.empService.checkUsernameAvailablity(this.username)).exists())
    {
      this.toast('Username is already used by another employee', 'warning');
      this.username = null;
    }

  }

  async checkEmail()
  {
    if((await this.empService.checkEmailAvailablity(this.email)).exists())
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

  async uploadImage(empId)
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

      const empId = this.empService.generateId();
      const data = 
      {
        'employeeId': empId,
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

      this.empService.addEmployee(data)
      .then(async ()=> {
        if(this.img)
        {
          await this.uploadImage(empId);
        }
      })
      .then(()=> 
      {
        if(this.img)
        {
          setTimeout(()=>
          {
            this.strgSubs = this.storage.ref(`employees/${empId}/c/img_1000x1000`).getDownloadURL()
            .subscribe(async(res)=>
            {
              await this.empService.updateEmployee(empId, {'photo':res});
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


  // async importData()
  // {
  //   const start = Date.parse('1970-01-01');
  //   const end = Date.parse('2004-01-01');
   
  //   let empDatas = [ 
  //     { 
  //     "employeeId":"738fbc58-8930-4ec1-831b-0ca94b7311ee",
  //     "firstName":"Clint",
  //     "lastName":"Irwin",
  //     "email":"Clint_Irwin1153@yahoo.com",
  //     "username":"Irwin Clint",
  //     "birthDate":"2115-06-22 00:49:09Z",
  //     "basicSalary":"84435782",
  //     "status":"Health Educator",
  //     "group":"u5aMBm",
  //     "description":"Finance"
  //     },
  //     { 
  //     "employeeId":"f1d2dda6-23d4-4042-a33a-dca03c233b36",
  //     "firstName":"Benjamin",
  //     "lastName":"Brown",
  //     "email":"Benjamin_Brown8756@iatim.tech",
  //     "username":"Brown Benjamin",
  //     "birthDate":"4882-08-10 00:28:33Z",
  //     "basicSalary":"67379091",
  //     "status":"Pharmacist",
  //     "group":"eUuXpm",
  //     "description":"Human Resources"
  //     },
  //     { 
  //     "employeeId":"69415a13-ecf6-4039-901a-98ce12edebd7",
  //     "firstName":"Erick",
  //     "lastName":"Vincent",
  //     "email":"Erick_Vincent6895@twipet.com",
  //     "username":"Vincent Erick",
  //     "birthDate":"9927-09-25 04:16:11Z",
  //     "basicSalary":"66607280",
  //     "status":"IT Support Staff",
  //     "group":"5add1a",
  //     "description":"Human Resources"
  //     },
  //     { 
  //     "employeeId":"2b8a535f-c6ec-417f-849a-49b8363031c3",
  //     "firstName":"Hayden",
  //     "lastName":"Ballard",
  //     "email":"Hayden_Ballard3013@deons.tech",
  //     "username":"Ballard Hayden",
  //     "birthDate":"5543-02-06 14:22:45Z",
  //     "basicSalary":"69138568",
  //     "status":"Webmaster",
  //     "group":"oWQy8e",
  //     "description":"Research and Development"
  //     },
  //     { 
  //     "employeeId":"2dc245c5-7367-4eaa-97b0-b651e57cb87a",
  //     "firstName":"Daria",
  //     "lastName":"Hill",
  //     "email":"Daria_Hill4562@nimogy.biz",
  //     "username":"Hill Daria",
  //     "birthDate":"3657-04-10 06:22:00Z",
  //     "basicSalary":"65586601",
  //     "status":"Associate Professor",
  //     "group":"kAdUJg",
  //     "description":"Research and Development"
  //     },
  //     { 
  //     "employeeId":"07c0bf43-2ef1-41d7-97df-10f94a84e852",
  //     "firstName":"Peyton",
  //     "lastName":"Vane",
  //     "email":"Peyton_Vane3474@famism.biz",
  //     "username":"Vane Peyton",
  //     "birthDate":"9225-08-24 04:29:45Z",
  //     "basicSalary":"56331790",
  //     "status":"Healthcare Specialist",
  //     "group":"MHb8pz",
  //     "description":"Marketing"
  //     },
  //     { 
  //     "employeeId":"d6911a4f-4024-42d1-bfae-13c72bb9323e",
  //     "firstName":"Julius",
  //     "lastName":"Flack",
  //     "email":"Julius_Flack5055@fuliss.net",
  //     "username":"Flack Julius",
  //     "birthDate":"7151-11-26 12:58:08Z",
  //     "basicSalary":"22147805",
  //     "status":"Electrician",
  //     "group":"BUNt8m",
  //     "description":"Human Resources"
  //     },
  //     { 
  //     "employeeId":"413cfa5f-e4a2-4e38-aea1-11fddc19be4e",
  //     "firstName":"Georgia",
  //     "lastName":"Watson",
  //     "email":"Georgia_Watson4069@eirey.tech",
  //     "username":"Watson Georgia",
  //     "birthDate":"1906-03-26 13:43:05Z",
  //     "basicSalary":"82509101",
  //     "status":"Cook",
  //     "group":"wmUnJQ",
  //     "description":"Research and Development"
  //     },
  //     { 
  //     "employeeId":"3e34a8ab-ed0c-488a-a231-250de2ff9369",
  //     "firstName":"Ema",
  //     "lastName":"Jennson",
  //     "email":"Ema_Jennson1@typill.biz",
  //     "username":"Jennson Ema",
  //     "birthDate":"0503-04-15 17:01:49Z",
  //     "basicSalary":"75751353",
  //     "status":"Retail Trainee",
  //     "group":"DdIyrj",
  //     "description":"Marketing"
  //     },
  //     { 
  //     "employeeId":"211b157a-5354-4385-b313-47df912d173f",
  //     "firstName":"Chris",
  //     "lastName":"Clarkson",
  //     "email":"Chris_Clarkson9033@bulaffy.com",
  //     "username":"Clarkson Chris",
  //     "birthDate":"2730-03-18 14:42:28Z",
  //     "basicSalary":"38052644",
  //     "status":"Clerk",
  //     "group":"UXK62O",
  //     "description":"Sales"
  //     },
  //     { 
  //     "employeeId":"da3e3c5e-33db-4799-a8a0-e8a09d025eb8",
  //     "firstName":"Charlotte",
  //     "lastName":"Boyle",
  //     "email":"Charlotte_Boyle1528@iatim.tech",
  //     "username":"Boyle Charlotte",
  //     "birthDate":"2100-11-02 08:49:31Z",
  //     "basicSalary":"7327415",
  //     "status":"Design Engineer",
  //     "group":"X74veM",
  //     "description":"Sales"
  //     },
  //     { 
  //     "employeeId":"55210689-adac-4d90-8fd3-01fef55af6ae",
  //     "firstName":"Alexander",
  //     "lastName":"Walker",
  //     "email":"Alexander_Walker9400@gmail.com",
  //     "username":"Walker Alexander",
  //     "birthDate":"0885-04-12 13:25:27Z",
  //     "basicSalary":"51644838",
  //     "status":"Front Desk Coordinator",
  //     "group":"CHk4Co",
  //     "description":"Accounting"
  //     },
  //     { 
  //     "employeeId":"611d24cc-21b8-499e-8b2d-06c80b7cd661",
  //     "firstName":"Logan",
  //     "lastName":"Yarwood",
  //     "email":"Logan_Yarwood2333@grannar.com",
  //     "username":"Yarwood Logan",
  //     "birthDate":"0663-04-22 17:34:21Z",
  //     "basicSalary":"14336512",
  //     "status":"Ambulatory Nurse",
  //     "group":"oj28Kd",
  //     "description":"Accounting"
  //     },
  //     { 
  //     "employeeId":"2159369e-50c2-4897-a657-e6ccd2e2f75d",
  //     "firstName":"Livia",
  //     "lastName":"Vane",
  //     "email":"Livia_Vane7854@mafthy.com",
  //     "username":"Vane Livia",
  //     "birthDate":"1975-03-19 17:51:28Z",
  //     "basicSalary":"50213836",
  //     "status":"Auditor",
  //     "group":"vd5QRN",
  //     "description":"Management"
  //     },
  //     { 
  //     "employeeId":"e9e39195-75e5-47b8-a719-d5c2a6efa3a5",
  //     "firstName":"Javier",
  //     "lastName":"Nanton",
  //     "email":"Javier_Nanton8692@tonsy.org",
  //     "username":"Nanton Javier",
  //     "birthDate":"7901-05-25 16:27:02Z",
  //     "basicSalary":"81789782",
  //     "status":"Loan Officer",
  //     "group":"dE6GfM",
  //     "description":"Operations"
  //     },
  //     { 
  //     "employeeId":"298db357-cafc-4a9c-8008-56c6a8870a09",
  //     "firstName":"Chris",
  //     "lastName":"Tennant",
  //     "email":"Chris_Tennant6591@corti.com",
  //     "username":"Tennant Chris",
  //     "birthDate":"6796-11-15 13:15:39Z",
  //     "basicSalary":"62464020",
  //     "status":"Biologist",
  //     "group":"cXSokO",
  //     "description":"Management"
  //     },
  //     { 
  //     "employeeId":"1b5db417-da51-4974-a34c-182c10b1dd35",
  //     "firstName":"Eileen",
  //     "lastName":"Santos",
  //     "email":"Eileen_Santos9252@dionrab.com",
  //     "username":"Santos Eileen",
  //     "birthDate":"1170-07-23 03:55:55Z",
  //     "basicSalary":"99994699",
  //     "status":"Health Educator",
  //     "group":"8p8stg",
  //     "description":"Sales"
  //     },
  //     { 
  //     "employeeId":"2037f79a-3764-4e87-9ffc-27d54ffd6577",
  //     "firstName":"Brad",
  //     "lastName":"Stewart",
  //     "email":"Brad_Stewart6115@twipet.com",
  //     "username":"Stewart Brad",
  //     "birthDate":"9281-05-12 02:06:49Z",
  //     "basicSalary":"59943957",
  //     "status":"Chef Manager",
  //     "group":"mzdrwY",
  //     "description":"Human Resources"
  //     },
  //     { 
  //     "employeeId":"4f418ecf-e7ca-446d-b507-c5afbd08e901",
  //     "firstName":"Alexander",
  //     "lastName":"Sanchez",
  //     "email":"Alexander_Sanchez1147@cispeto.com",
  //     "username":"Sanchez Alexander",
  //     "birthDate":"5480-08-15 16:34:50Z",
  //     "basicSalary":"71743800",
  //     "status":"Banker",
  //     "group":"ouow4b",
  //     "description":"Finance"
  //     },
  //     { 
  //     "employeeId":"aa2b4188-b635-4691-8d77-28f02fde9a78",
  //     "firstName":"Rufus",
  //     "lastName":"Phillips",
  //     "email":"Rufus_Phillips9940@typill.biz",
  //     "username":"Phillips Rufus",
  //     "birthDate":"9605-05-16 06:33:30Z",
  //     "basicSalary":"35463230",
  //     "status":"Designer",
  //     "group":"5Q2kdI",
  //     "description":"IT"
  //     },
  //     { 
  //     "employeeId":"ba1d13f9-ae27-469b-beca-ed33abc5a16b",
  //     "firstName":"William",
  //     "lastName":"Gunn",
  //     "email":"William_Gunn1357@zorer.org",
  //     "username":"Gunn William",
  //     "birthDate":"7001-01-04 01:24:09Z",
  //     "basicSalary":"20978004",
  //     "status":"Stockbroker",
  //     "group":"w04CtK",
  //     "description":"Research and Development"
  //     },
  //     { 
  //     "employeeId":"afb29df8-0ad7-4f58-8203-3538ee5fe3ab",
  //     "firstName":"Rose",
  //     "lastName":"Rust",
  //     "email":"Rose_Rust4574@hourpy.biz",
  //     "username":"Rust Rose",
  //     "birthDate":"9341-03-27 00:24:24Z",
  //     "basicSalary":"93992527",
  //     "status":"Audiologist",
  //     "group":"EEQfGl",
  //     "description":"Accounting"
  //     },
  //     { 
  //     "employeeId":"eaa8df47-e742-49c9-9b4b-5ebafe00593c",
  //     "firstName":"Melinda",
  //     "lastName":"Reid",
  //     "email":"Melinda_Reid9854@bungar.biz",
  //     "username":"Reid Melinda",
  //     "birthDate":"3963-06-02 18:06:43Z",
  //     "basicSalary":"74628241",
  //     "status":"Physician",
  //     "group":"Q3gsq5",
  //     "description":"Operations"
  //     },
  //     { 
  //     "employeeId":"b18a5548-db05-495d-9ec9-991b73fb1059",
  //     "firstName":"Hayden",
  //     "lastName":"Patel",
  //     "email":"Hayden_Patel8267@sveldo.biz",
  //     "username":"Patel Hayden",
  //     "birthDate":"4718-02-13 06:07:57Z",
  //     "basicSalary":"13216031",
  //     "status":"Steward",
  //     "group":"iQuSmg",
  //     "description":"IT"
  //     },
  //     { 
  //     "employeeId":"d21f0170-c8dc-4872-89c7-c01598ad072f",
  //     "firstName":"Benny",
  //     "lastName":"Phillips",
  //     "email":"Benny_Phillips6336@nickia.com",
  //     "username":"Phillips Benny",
  //     "birthDate":"7225-09-16 04:17:54Z",
  //     "basicSalary":"17563207",
  //     "status":"Project Manager",
  //     "group":"4WYV9b",
  //     "description":"Sales"
  //     },
  //     { 
  //     "employeeId":"b209a042-55e2-4d4d-8d6a-8e366cbe838b",
  //     "firstName":"Lara",
  //     "lastName":"Warner",
  //     "email":"Lara_Warner1491@nimogy.biz",
  //     "username":"Warner Lara",
  //     "birthDate":"7985-06-15 09:41:00Z",
  //     "basicSalary":"21720305",
  //     "status":"Physician",
  //     "group":"t7QACa",
  //     "description":"Management"
  //     },
  //     { 
  //     "employeeId":"d4f3128c-c222-4509-84b1-101b51ed4163",
  //     "firstName":"Kate",
  //     "lastName":"Bennett",
  //     "email":"Kate_Bennett4783@iatim.tech",
  //     "username":"Bennett Kate",
  //     "birthDate":"8006-06-01 12:09:04Z",
  //     "basicSalary":"9993208",
  //     "status":"Machine Operator",
  //     "group":"rNQSjZ",
  //     "description":"Marketing"
  //     },
  //     { 
  //     "employeeId":"8d07d008-135e-45ab-8454-518a45b003e2",
  //     "firstName":"Carissa",
  //     "lastName":"Ballard",
  //     "email":"Carissa_Ballard8867@gembat.biz",
  //     "username":"Ballard Carissa",
  //     "birthDate":"9569-05-27 16:00:48Z",
  //     "basicSalary":"22894772",
  //     "status":"Designer",
  //     "group":"v3T79K",
  //     "description":"Accounting"
  //     },
  //     { 
  //     "employeeId":"c69ef783-a915-4d0d-8e15-a9bdd9d2b820",
  //     "firstName":"Jules",
  //     "lastName":"Yates",
  //     "email":"Jules_Yates5911@vetan.org",
  //     "username":"Yates Jules",
  //     "birthDate":"5407-07-27 16:21:57Z",
  //     "basicSalary":"33943165",
  //     "status":"CNC Operator",
  //     "group":"MbY12v",
  //     "description":"Management"
  //     },
  //     { 
  //     "employeeId":"c1a28bbe-3ee5-4ba9-86b3-9fb7bbbe5266",
  //     "firstName":"Tom",
  //     "lastName":"Clarke",
  //     "email":"Tom_Clarke2450@sheye.org",
  //     "username":"Clarke Tom",
  //     "birthDate":"6207-11-12 22:20:57Z",
  //     "basicSalary":"34135844",
  //     "status":"Restaurant Manager",
  //     "group":"ZtOG1C",
  //     "description":"IT"
  //     },
  //     { 
  //     "employeeId":"9af8cfd9-5cdb-4ebe-b1cc-efeea5ba7dd6",
  //     "firstName":"Julius",
  //     "lastName":"Lomax",
  //     "email":"Julius_Lomax3304@nanoff.biz",
  //     "username":"Lomax Julius",
  //     "birthDate":"8404-06-16 22:23:02Z",
  //     "basicSalary":"64245820",
  //     "status":"Insurance Broker",
  //     "group":"w4Bioe",
  //     "description":"Human Resources"
  //     },
  //     { 
  //     "employeeId":"e3e1f2a0-93e6-4de9-ae38-bf8834bea6a4",
  //     "firstName":"Jayden",
  //     "lastName":"Alcroft",
  //     "email":"Jayden_Alcroft1322@iatim.tech",
  //     "username":"Alcroft Jayden",
  //     "birthDate":"2537-02-23 12:23:12Z",
  //     "basicSalary":"58074463",
  //     "status":"Clerk",
  //     "group":"tGjWMe",
  //     "description":"Purchasing"
  //     },
  //     { 
  //     "employeeId":"b87478dc-aa7d-410f-afab-c639a8503b81",
  //     "firstName":"Chester",
  //     "lastName":"Stone",
  //     "email":"Chester_Stone9672@jiman.org",
  //     "username":"Stone Chester",
  //     "birthDate":"3730-12-21 13:20:35Z",
  //     "basicSalary":"23907717",
  //     "status":"Health Educator",
  //     "group":"I1Ft2O",
  //     "description":"Sales"
  //     },
  //     { 
  //     "employeeId":"a8ab02c2-eb71-4bb9-bb49-99957c518512",
  //     "firstName":"Sebastian",
  //     "lastName":"Rowlands",
  //     "email":"Sebastian_Rowlands2613@sheye.org",
  //     "username":"Rowlands Sebastian",
  //     "birthDate":"7682-01-24 14:24:49Z",
  //     "basicSalary":"33614496",
  //     "status":"Cook",
  //     "group":"LZrgd2",
  //     "description":"Management"
  //     },
  //     { 
  //     "employeeId":"8f7b7ddf-296e-4d5a-a7e4-d4b5145236b0",
  //     "firstName":"Phillip",
  //     "lastName":"Upton",
  //     "email":"Phillip_Upton5909@grannar.com",
  //     "username":"Upton Phillip",
  //     "birthDate":"2749-05-03 15:20:58Z",
  //     "basicSalary":"11889895",
  //     "status":"Assistant Buyer",
  //     "group":"eANUle",
  //     "description":"Human Resources"
  //     },
  //     { 
  //     "employeeId":"bcd0f5d8-3a13-4e33-a42b-85f6c88315ea",
  //     "firstName":"Kassandra",
  //     "lastName":"Villiger",
  //     "email":"Kassandra_Villiger59@ubusive.com",
  //     "username":"Villiger Kassandra",
  //     "birthDate":"8386-10-26 12:15:48Z",
  //     "basicSalary":"43709135",
  //     "status":"Systems Administrator",
  //     "group":"rlXMYb",
  //     "description":"Operations"
  //     },
  //     { 
  //     "employeeId":"4ef38667-944c-4253-9cbd-19c11aa27627",
  //     "firstName":"Livia",
  //     "lastName":"Rixon",
  //     "email":"Livia_Rixon7911@vetan.org",
  //     "username":"Rixon Livia",
  //     "birthDate":"4153-11-14 17:32:42Z",
  //     "basicSalary":"37387827",
  //     "status":"Cash Manager",
  //     "group":"T0xNRc",
  //     "description":"Management"
  //     },
  //     { 
  //     "employeeId":"17617e66-23fd-4900-a8c6-28ec5cde3764",
  //     "firstName":"Jack",
  //     "lastName":"Phillips",
  //     "email":"Jack_Phillips1893@famism.biz",
  //     "username":"Phillips Jack",
  //     "birthDate":"2858-04-30 10:14:33Z",
  //     "basicSalary":"32936835",
  //     "status":"Physician",
  //     "group":"URlvu3",
  //     "description":"Management"
  //     },
  //     { 
  //     "employeeId":"9b399d8c-ffca-4988-8436-cfc2ac4e3318",
  //     "firstName":"Alexa",
  //     "lastName":"Uddin",
  //     "email":"Alexa_Uddin9731@liret.org",
  //     "username":"Uddin Alexa",
  //     "birthDate":"7856-12-17 02:11:57Z",
  //     "basicSalary":"52824984",
  //     "status":"Budget Analyst",
  //     "group":"8dU41b",
  //     "description":"Purchasing"
  //     },
  //     { 
  //     "employeeId":"28ebb458-757b-4c74-a9eb-d94d6b070bed",
  //     "firstName":"Maya",
  //     "lastName":"Rowlands",
  //     "email":"Maya_Rowlands4064@ubusive.com",
  //     "username":"Rowlands Maya",
  //     "birthDate":"3539-03-13 19:27:04Z",
  //     "basicSalary":"41894859",
  //     "status":"Dentist",
  //     "group":"qhF4zs",
  //     "description":"Human Resources"
  //     },
  //     { 
  //     "employeeId":"8820087f-aaf2-4144-b7f7-a1742aa92584",
  //     "firstName":"Grace",
  //     "lastName":"Watson",
  //     "email":"Grace_Watson5357@dionrab.com",
  //     "username":"Watson Grace",
  //     "birthDate":"8520-04-11 07:56:40Z",
  //     "basicSalary":"60579297",
  //     "status":"Treasurer",
  //     "group":"JZZJvf",
  //     "description":"Management"
  //     },
  //     { 
  //     "employeeId":"5856f4f7-9494-40f9-a115-fbd7fbafb282",
  //     "firstName":"Cherish",
  //     "lastName":"Sheldon",
  //     "email":"Cherish_Sheldon5715@twace.org",
  //     "username":"Sheldon Cherish",
  //     "birthDate":"7632-02-03 16:43:07Z",
  //     "basicSalary":"31039253",
  //     "status":"Inspector",
  //     "group":"dEnlpb",
  //     "description":"Accounting"
  //     },
  //     { 
  //     "employeeId":"d4633140-de8f-494d-b829-0112ab186943",
  //     "firstName":"Julian",
  //     "lastName":"Farrell",
  //     "email":"Julian_Farrell2141@deons.tech",
  //     "username":"Farrell Julian",
  //     "birthDate":"3860-03-14 15:15:38Z",
  //     "basicSalary":"92777596",
  //     "status":"CNC Operator",
  //     "group":"ohvkhg",
  //     "description":"Operations"
  //     },
  //     { 
  //     "employeeId":"e88d7761-8c58-4205-8796-2f75cda417a6",
  //     "firstName":"Ema",
  //     "lastName":"Broomfield",
  //     "email":"Ema_Broomfield4394@hourpy.biz",
  //     "username":"Broomfield Ema",
  //     "birthDate":"3392-01-30 16:02:58Z",
  //     "basicSalary":"24349752",
  //     "status":"Cook",
  //     "group":"Kit7q7",
  //     "description":"Sales"
  //     },
  //     { 
  //     "employeeId":"3e0dd6cc-f5a7-4fa6-88f3-356646705a0f",
  //     "firstName":"Barney",
  //     "lastName":"Lindsay",
  //     "email":"Barney_Lindsay4996@bulaffy.com",
  //     "username":"Lindsay Barney",
  //     "birthDate":"8684-02-21 02:46:44Z",
  //     "basicSalary":"49648992",
  //     "status":"Global Logistics Supervisor",
  //     "group":"L2gHBT",
  //     "description":"Operations"
  //     },
  //     { 
  //     "employeeId":"16181734-41b7-4d0d-9297-d3db2088a1e1",
  //     "firstName":"Chadwick",
  //     "lastName":"Clayton",
  //     "email":"Chadwick_Clayton1224@corti.com",
  //     "username":"Clayton Chadwick",
  //     "birthDate":"0547-11-01 09:27:43Z",
  //     "basicSalary":"51026312",
  //     "status":"Baker",
  //     "group":"Pq0yyn",
  //     "description":"Accounting"
  //     },
  //     { 
  //     "employeeId":"69f36129-a751-4c81-bca5-5f633d709b75",
  //     "firstName":"Jane",
  //     "lastName":"Emmett",
  //     "email":"Jane_Emmett9783@ubusive.com",
  //     "username":"Emmett Jane",
  //     "birthDate":"0424-07-19 13:14:17Z",
  //     "basicSalary":"80135508",
  //     "status":"Accountant",
  //     "group":"9DhaWD",
  //     "description":"IT"
  //     },
  //     { 
  //     "employeeId":"4fa82a9d-6614-4582-97f6-3d8d51ee92cc",
  //     "firstName":"Mike",
  //     "lastName":"Fisher",
  //     "email":"Mike_Fisher32@deons.tech",
  //     "username":"Fisher Mike",
  //     "birthDate":"4402-09-23 02:36:24Z",
  //     "basicSalary":"52621099",
  //     "status":"Systems Administrator",
  //     "group":"3XE2qf",
  //     "description":"Accounting"
  //     },
  //     { 
  //     "employeeId":"976cdda0-5cdb-48b8-bd4a-67b40cac148c",
  //     "firstName":"Ilona",
  //     "lastName":"Rust",
  //     "email":"Ilona_Rust8520@womeona.net",
  //     "username":"Rust Ilona",
  //     "birthDate":"2411-02-06 17:35:08Z",
  //     "basicSalary":"75786688",
  //     "status":"Audiologist",
  //     "group":"zyTxM5",
  //     "description":"Research and Development"
  //     },
  //     { 
  //     "employeeId":"4b1b9097-efc5-4228-bd1f-aa7971539f03",
  //     "firstName":"Clint",
  //     "lastName":"Gunn",
  //     "email":"Clint_Gunn5058@qater.org",
  //     "username":"Gunn Clint",
  //     "birthDate":"7154-07-31 14:05:27Z",
  //     "basicSalary":"42844632",
  //     "status":"Health Educator",
  //     "group":"PHWB8s",
  //     "description":"Management"
  //     },
  //     { 
  //     "employeeId":"c792ff0b-3841-41cd-b336-aa1f77437bc9",
  //     "firstName":"Sabrina",
  //     "lastName":"Reynolds",
  //     "email":"Sabrina_Reynolds3645@eirey.tech",
  //     "username":"Reynolds Sabrina",
  //     "birthDate":"4875-08-18 06:22:10Z",
  //     "basicSalary":"59830985",
  //     "status":"Executive Director",
  //     "group":"cFKJA1",
  //     "description":"Finance"
  //     },
  //     { 
  //     "employeeId":"2b09c42b-5363-4516-ace6-adcebf49877c",
  //     "firstName":"Leah",
  //     "lastName":"Gallacher",
  //     "email":"Leah_Gallacher3135@liret.org",
  //     "username":"Gallacher Leah",
  //     "birthDate":"4427-04-09 17:21:11Z",
  //     "basicSalary":"89947960",
  //     "status":"Biologist",
  //     "group":"Ex0lZn",
  //     "description":"Research and Development"
  //     },
  //     { 
  //     "employeeId":"19db33b4-25b1-481e-aa5a-15d8fb9d0e44",
  //     "firstName":"Sadie",
  //     "lastName":"Wright",
  //     "email":"Sadie_Wright2736@gembat.biz",
  //     "username":"Wright Sadie",
  //     "birthDate":"4707-01-14 12:02:23Z",
  //     "basicSalary":"99733181",
  //     "status":"Cashier",
  //     "group":"OFGfCR",
  //     "description":"Operations"
  //     },
  //     { 
  //     "employeeId":"c341373e-cd11-4eb0-82f3-d07d052e89b5",
  //     "firstName":"Jessica",
  //     "lastName":"Clarke",
  //     "email":"Jessica_Clarke8072@mafthy.com",
  //     "username":"Clarke Jessica",
  //     "birthDate":"8807-04-27 06:23:44Z",
  //     "basicSalary":"15386695",
  //     "status":"Bookkeeper",
  //     "group":"01qhQY",
  //     "description":"Management"
  //     },
  //     { 
  //     "employeeId":"d6f7a5c6-120a-481f-aa61-3b60740a9cd7",
  //     "firstName":"Chelsea",
  //     "lastName":"Stubbs",
  //     "email":"Chelsea_Stubbs3295@naiker.biz",
  //     "username":"Stubbs Chelsea",
  //     "birthDate":"1774-12-25 00:45:02Z",
  //     "basicSalary":"96853104",
  //     "status":"Treasurer",
  //     "group":"givjBx",
  //     "description":"Management"
  //     },
  //     { 
  //     "employeeId":"53d77008-17a1-4ada-b453-52dbe5ac4b8f",
  //     "firstName":"Erick",
  //     "lastName":"Vollans",
  //     "email":"Erick_Vollans3938@extex.org",
  //     "username":"Vollans Erick",
  //     "birthDate":"7989-11-12 16:24:16Z",
  //     "basicSalary":"57602586",
  //     "status":"Laboratory Technician",
  //     "group":"nqzrGU",
  //     "description":"Research and Development"
  //     },
  //     { 
  //     "employeeId":"1354c591-70b6-417e-bf5d-047d86661de8",
  //     "firstName":"Alessandra",
  //     "lastName":"Osmond",
  //     "email":"Alessandra_Osmond6303@sheye.org",
  //     "username":"Osmond Alessandra",
  //     "birthDate":"8088-05-25 19:18:35Z",
  //     "basicSalary":"25438226",
  //     "status":"Budget Analyst",
  //     "group":"BR02KL",
  //     "description":"Operations"
  //     },
  //     { 
  //     "employeeId":"7e5f5bbc-4e0b-452e-a3f8-157b247bfaf5",
  //     "firstName":"Nicholas",
  //     "lastName":"Hobbs",
  //     "email":"Nicholas_Hobbs1416@vetan.org",
  //     "username":"Hobbs Nicholas",
  //     "birthDate":"3635-11-06 20:28:38Z",
  //     "basicSalary":"43962601",
  //     "status":"Healthcare Specialist",
  //     "group":"8zbarY",
  //     "description":"Operations"
  //     },
  //     { 
  //     "employeeId":"91341f0e-3dc1-4043-b185-631b99683510",
  //     "firstName":"Alessia",
  //     "lastName":"Vaughn",
  //     "email":"Alessia_Vaughn646@grannar.com",
  //     "username":"Vaughn Alessia",
  //     "birthDate":"6664-06-05 04:29:50Z",
  //     "basicSalary":"28678580",
  //     "status":"Healthcare Specialist",
  //     "group":"RugoGk",
  //     "description":"Purchasing"
  //     },
  //     { 
  //     "employeeId":"44384194-78a6-48a6-acd9-97ef9383b29b",
  //     "firstName":"Aiden",
  //     "lastName":"Newman",
  //     "email":"Aiden_Newman1156@brety.org",
  //     "username":"Newman Aiden",
  //     "birthDate":"2780-02-02 03:24:02Z",
  //     "basicSalary":"64492750",
  //     "status":"Ambulatory Nurse",
  //     "group":"GkjbVR",
  //     "description":"Sales"
  //     },
  //     { 
  //     "employeeId":"a94aa47e-c7e0-428a-bb1d-06dc7aa3a66a",
  //     "firstName":"Sadie",
  //     "lastName":"Riley",
  //     "email":"Sadie_Riley7668@ovock.tech",
  //     "username":"Riley Sadie",
  //     "birthDate":"1076-05-18 11:38:12Z",
  //     "basicSalary":"39107717",
  //     "status":"Software Engineer",
  //     "group":"vTs1ZR",
  //     "description":"Finance"
  //     },
  //     { 
  //     "employeeId":"aef6ecad-beb4-42a0-b185-6068b9ee937b",
  //     "firstName":"Courtney",
  //     "lastName":"Parker",
  //     "email":"Courtney_Parker7645@bulaffy.com",
  //     "username":"Parker Courtney",
  //     "birthDate":"1366-12-13 14:33:06Z",
  //     "basicSalary":"76992984",
  //     "status":"Software Engineer",
  //     "group":"szZO5i",
  //     "description":"Marketing"
  //     },
  //     { 
  //     "employeeId":"8053fad0-ae52-46e3-a20a-864b6ad70cda",
  //     "firstName":"Evelynn",
  //     "lastName":"Lloyd",
  //     "email":"Evelynn_Lloyd5536@vetan.org",
  //     "username":"Lloyd Evelynn",
  //     "birthDate":"0720-07-24 01:46:44Z",
  //     "basicSalary":"31582355",
  //     "status":"Cashier",
  //     "group":"pOKRhd",
  //     "description":"Accounting"
  //     },
  //     { 
  //     "employeeId":"97eb5fef-5581-4198-9dcd-3ff08c9148fd",
  //     "firstName":"Bryce",
  //     "lastName":"Hopkins",
  //     "email":"Bryce_Hopkins6237@atink.com",
  //     "username":"Hopkins Bryce",
  //     "birthDate":"3771-07-07 22:43:58Z",
  //     "basicSalary":"51901420",
  //     "status":"Cook",
  //     "group":"PgYKtJ",
  //     "description":"IT"
  //     },
  //     { 
  //     "employeeId":"b9181e1d-64ef-4cb4-9acd-3658f318aa0d",
  //     "firstName":"Jaylene",
  //     "lastName":"Ralph",
  //     "email":"Jaylene_Ralph6572@nimogy.biz",
  //     "username":"Ralph Jaylene",
  //     "birthDate":"1103-03-05 08:20:15Z",
  //     "basicSalary":"46323074",
  //     "status":"Cook",
  //     "group":"eaS6u5",
  //     "description":"Sales"
  //     },
  //     { 
  //     "employeeId":"91239f37-6fe0-4b8a-9701-f8ce3a6f0ae5",
  //     "firstName":"Mary",
  //     "lastName":"Freeburn",
  //     "email":"Mary_Freeburn1691@grannar.com",
  //     "username":"Freeburn Mary",
  //     "birthDate":"8739-01-10 01:33:15Z",
  //     "basicSalary":"52798070",
  //     "status":"Bookkeeper",
  //     "group":"4feBpL",
  //     "description":"Marketing"
  //     },
  //     { 
  //     "employeeId":"f61bce3a-9ecc-4efd-98af-ab5b9c8ce1cd",
  //     "firstName":"Jennifer",
  //     "lastName":"Drake",
  //     "email":"Jennifer_Drake4440@eirey.tech",
  //     "username":"Drake Jennifer",
  //     "birthDate":"8038-12-05 02:33:12Z",
  //     "basicSalary":"52374285",
  //     "status":"Dentist",
  //     "group":"OTwcYK",
  //     "description":"Operations"
  //     },
  //     { 
  //     "employeeId":"de62b226-1894-40ab-985d-358093868afa",
  //     "firstName":"Hank",
  //     "lastName":"Stewart",
  //     "email":"Hank_Stewart2891@gompie.com",
  //     "username":"Stewart Hank",
  //     "birthDate":"1194-08-09 19:51:33Z",
  //     "basicSalary":"37754390",
  //     "status":"Loan Officer",
  //     "group":"BdvGwZ",
  //     "description":"Operations"
  //     },
  //     { 
  //     "employeeId":"f1542ca0-8269-415c-af3a-6422f9008fc3",
  //     "firstName":"Sage",
  //     "lastName":"Richards",
  //     "email":"Sage_Richards7114@famism.biz",
  //     "username":"Richards Sage",
  //     "birthDate":"9957-12-15 15:34:29Z",
  //     "basicSalary":"8064306",
  //     "status":"Web Developer",
  //     "group":"9bHUei",
  //     "description":"Purchasing"
  //     },
  //     { 
  //     "employeeId":"6b8107a4-26aa-492a-a9e6-6dd290627f7f",
  //     "firstName":"Bart",
  //     "lastName":"Stewart",
  //     "email":"Bart_Stewart9733@vetan.org",
  //     "username":"Stewart Bart",
  //     "birthDate":"3770-08-29 05:45:37Z",
  //     "basicSalary":"23007534",
  //     "status":"Bellman",
  //     "group":"TIgW1s",
  //     "description":"Purchasing"
  //     },
  //     { 
  //     "employeeId":"eb900921-239d-45a7-83f1-9595aeda21ca",
  //     "firstName":"Domenic",
  //     "lastName":"Owens",
  //     "email":"Domenic_Owens7685@iatim.tech",
  //     "username":"Owens Domenic",
  //     "birthDate":"9924-02-04 14:47:40Z",
  //     "basicSalary":"59737044",
  //     "status":"HR Coordinator",
  //     "group":"yr9MGY",
  //     "description":"Management"
  //     },
  //     { 
  //     "employeeId":"25b808d9-6cbc-4726-87a2-cc516d01779c",
  //     "firstName":"Carina",
  //     "lastName":"Kent",
  //     "email":"Carina_Kent49@irrepsy.com",
  //     "username":"Kent Carina",
  //     "birthDate":"2863-09-12 08:27:32Z",
  //     "basicSalary":"21999183",
  //     "status":"Auditor",
  //     "group":"omkYRU",
  //     "description":"Marketing"
  //     },
  //     { 
  //     "employeeId":"7f531cb4-0604-4fe4-af03-faf599299d13",
  //     "firstName":"Rick",
  //     "lastName":"Fulton",
  //     "email":"Rick_Fulton7714@acrit.org",
  //     "username":"Fulton Rick",
  //     "birthDate":"8039-09-02 16:38:51Z",
  //     "basicSalary":"81797680",
  //     "status":"Staffing Consultant",
  //     "group":"CHCIAC",
  //     "description":"Purchasing"
  //     },
  //     { 
  //     "employeeId":"a916398d-ed32-49a9-8c91-a37abfd549d6",
  //     "firstName":"Marvin",
  //     "lastName":"Camden",
  //     "email":"Marvin_Camden8473@joiniaa.com",
  //     "username":"Camden Marvin",
  //     "birthDate":"1752-03-06 10:25:52Z",
  //     "basicSalary":"6576628",
  //     "status":"Inspector",
  //     "group":"TaZoCO",
  //     "description":"Sales"
  //     },
  //     { 
  //     "employeeId":"0c9bc3e4-2659-40bf-a0fb-6a713447fc73",
  //     "firstName":"Tyler",
  //     "lastName":"Jenkin",
  //     "email":"Tyler_Jenkin7175@bretoux.com",
  //     "username":"Jenkin Tyler",
  //     "birthDate":"8262-08-24 09:32:56Z",
  //     "basicSalary":"52686942",
  //     "status":"Dentist",
  //     "group":"2gmhXv",
  //     "description":"Marketing"
  //     },
  //     { 
  //     "employeeId":"e1a3edcd-5e36-4cd5-baf7-e73b6660afe4",
  //     "firstName":"Gabriel",
  //     "lastName":"Durrant",
  //     "email":"Gabriel_Durrant2373@ubusive.com",
  //     "username":"Durrant Gabriel",
  //     "birthDate":"9185-01-11 20:39:41Z",
  //     "basicSalary":"57320174",
  //     "status":"Ambulatory Nurse",
  //     "group":"EYExVD",
  //     "description":"Finance"
  //     },
  //     { 
  //     "employeeId":"644e4706-82f2-412d-a7b8-8d593c61ba4f",
  //     "firstName":"Erick",
  //     "lastName":"Booth",
  //     "email":"Erick_Booth909@elnee.tech",
  //     "username":"Booth Erick",
  //     "birthDate":"8426-01-13 04:55:21Z",
  //     "basicSalary":"6275424",
  //     "status":"Staffing Consultant",
  //     "group":"VvCocx",
  //     "description":"Human Resources"
  //     },
  //     { 
  //     "employeeId":"7929a84e-31ff-42c5-a792-3c1f9ce53d44",
  //     "firstName":"Danny",
  //     "lastName":"Reese",
  //     "email":"Danny_Reese4317@typill.biz",
  //     "username":"Reese Danny",
  //     "birthDate":"6355-06-26 02:50:10Z",
  //     "basicSalary":"89088349",
  //     "status":"Business Broker",
  //     "group":"AEKijs",
  //     "description":"Finance"
  //     },
  //     { 
  //     "employeeId":"9f40101e-9e8f-4a97-b9ca-75e5366e4bcf",
  //     "firstName":"Kenzie",
  //     "lastName":"Russell",
  //     "email":"Kenzie_Russell3746@yahoo.com",
  //     "username":"Russell Kenzie",
  //     "birthDate":"3925-03-21 12:52:10Z",
  //     "basicSalary":"38750461",
  //     "status":"Systems Administrator",
  //     "group":"Va5Qlw",
  //     "description":"Management"
  //     },
  //     { 
  //     "employeeId":"31ea76f1-4559-42b0-a685-43112e4e3dcf",
  //     "firstName":"Wade",
  //     "lastName":"Noach",
  //     "email":"Wade_Noach2006@infotech44.tech",
  //     "username":"Noach Wade",
  //     "birthDate":"5656-03-05 15:19:48Z",
  //     "basicSalary":"39140738",
  //     "status":"Inspector",
  //     "group":"TwMTrG",
  //     "description":"IT"
  //     },
  //     { 
  //     "employeeId":"49b51fe3-6e3e-4824-bfb6-0a9440a26ada",
  //     "firstName":"Laila",
  //     "lastName":"Wright",
  //     "email":"Laila_Wright3372@zorer.org",
  //     "username":"Wright Laila",
  //     "birthDate":"9167-08-01 10:45:04Z",
  //     "basicSalary":"82475136",
  //     "status":"IT Support Staff",
  //     "group":"LtdYMT",
  //     "description":"Accounting"
  //     },
  //     { 
  //     "employeeId":"79fc12e9-2b59-4d38-ba24-75336b0a088b",
  //     "firstName":"Rylee",
  //     "lastName":"Nicholls",
  //     "email":"Rylee_Nicholls270@deavo.com",
  //     "username":"Nicholls Rylee",
  //     "birthDate":"7009-09-24 13:11:55Z",
  //     "basicSalary":"86197478",
  //     "status":"Clerk",
  //     "group":"kCszm9",
  //     "description":"Operations"
  //     },
  //     { 
  //     "employeeId":"d5204009-e32c-418e-a2f9-00bd891231d4",
  //     "firstName":"Marina",
  //     "lastName":"Stewart",
  //     "email":"Marina_Stewart811@bauros.biz",
  //     "username":"Stewart Marina",
  //     "birthDate":"1954-09-27 11:50:50Z",
  //     "basicSalary":"66409045",
  //     "status":"Biologist",
  //     "group":"d5k2yu",
  //     "description":"Finance"
  //     },
  //     { 
  //     "employeeId":"7fccb0a8-e762-4069-a45d-538125489868",
  //     "firstName":"Logan",
  //     "lastName":"Edwards",
  //     "email":"Logan_Edwards9819@sheye.org",
  //     "username":"Edwards Logan",
  //     "birthDate":"6871-01-01 22:35:11Z",
  //     "basicSalary":"51484912",
  //     "status":"Bookkeeper",
  //     "group":"uVHexg",
  //     "description":"Accounting"
  //     },
  //     { 
  //     "employeeId":"bdfd121a-5879-49c9-b20f-bd7c0d532da9",
  //     "firstName":"Liam",
  //     "lastName":"Fulton",
  //     "email":"Liam_Fulton9924@grannar.com",
  //     "username":"Fulton Liam",
  //     "birthDate":"8455-04-11 19:54:33Z",
  //     "basicSalary":"48464867",
  //     "status":"Loan Officer",
  //     "group":"8rN72J",
  //     "description":"Management"
  //     },
  //     { 
  //     "employeeId":"8c88bcb2-9147-4321-a1f8-9614b5f920e8",
  //     "firstName":"Cadence",
  //     "lastName":"Briggs",
  //     "email":"Cadence_Briggs6651@sveldo.biz",
  //     "username":"Briggs Cadence",
  //     "birthDate":"1387-06-05 22:58:04Z",
  //     "basicSalary":"14662636",
  //     "status":"Cash Manager",
  //     "group":"g9IDcp",
  //     "description":"Research and Development"
  //     },
  //     { 
  //     "employeeId":"da5e09ca-0e9e-4f10-a6bb-97fa84f261e2",
  //     "firstName":"Nick",
  //     "lastName":"Brett",
  //     "email":"Nick_Brett6419@atink.com",
  //     "username":"Brett Nick",
  //     "birthDate":"8531-10-05 02:30:40Z",
  //     "basicSalary":"25018081",
  //     "status":"Systems Administrator",
  //     "group":"iwd7Fq",
  //     "description":"Research and Development"
  //     },
  //     { 
  //     "employeeId":"d20c1414-eed0-41c0-a78d-da6a5c673e06",
  //     "firstName":"Camellia",
  //     "lastName":"Potter",
  //     "email":"Camellia_Potter2730@extex.org",
  //     "username":"Potter Camellia",
  //     "birthDate":"5460-11-02 17:43:36Z",
  //     "basicSalary":"8335177",
  //     "status":"Physician",
  //     "group":"w4PhFU",
  //     "description":"IT"
  //     },
  //     { 
  //     "employeeId":"6ac434ca-61ab-48d0-b962-8734f0df39a0",
  //     "firstName":"Allison",
  //     "lastName":"West",
  //     "email":"Allison_West2866@womeona.net",
  //     "username":"West Allison",
  //     "birthDate":"5893-01-13 10:46:12Z",
  //     "basicSalary":"54977215",
  //     "status":"Accountant",
  //     "group":"yi4cOM",
  //     "description":"Marketing"
  //     },
  //     { 
  //     "employeeId":"9f00a5bf-8238-4c6e-90d7-6ec847b3ce07",
  //     "firstName":"Brad",
  //     "lastName":"Reading",
  //     "email":"Brad_Reading5003@zorer.org",
  //     "username":"Reading Brad",
  //     "birthDate":"4055-05-09 05:05:02Z",
  //     "basicSalary":"90376934",
  //     "status":"Cash Manager",
  //     "group":"hArJQt",
  //     "description":"Human Resources"
  //     },
  //     { 
  //     "employeeId":"02cd4394-5db0-4f0e-a9af-4a616a083497",
  //     "firstName":"Ramon",
  //     "lastName":"Sawyer",
  //     "email":"Ramon_Sawyer1808@typill.biz",
  //     "username":"Sawyer Ramon",
  //     "birthDate":"2108-11-06 07:13:24Z",
  //     "basicSalary":"80905844",
  //     "status":"Physician",
  //     "group":"iTqCV9",
  //     "description":"Purchasing"
  //     },
  //     { 
  //     "employeeId":"51886ffb-a0e5-45ba-b379-c5b92bf6b426",
  //     "firstName":"Holly",
  //     "lastName":"Mason",
  //     "email":"Holly_Mason1433@famism.biz",
  //     "username":"Mason Holly",
  //     "birthDate":"4510-11-14 12:32:28Z",
  //     "basicSalary":"68362233",
  //     "status":"Cook",
  //     "group":"mpSKP6",
  //     "description":"Human Resources"
  //     },
  //     { 
  //     "employeeId":"37be6ac4-b30d-4fbb-8064-342d4b7d86ab",
  //     "firstName":"Carter",
  //     "lastName":"Yang",
  //     "email":"Carter_Yang2645@nanoff.biz",
  //     "username":"Yang Carter",
  //     "birthDate":"6417-01-11 22:25:35Z",
  //     "basicSalary":"50982536",
  //     "status":"Clerk",
  //     "group":"leorFD",
  //     "description":"Research and Development"
  //     },
  //     { 
  //     "employeeId":"762b8e42-b12f-438d-a71f-1c2ef9e475f3",
  //     "firstName":"Marvin",
  //     "lastName":"Wooldridge",
  //     "email":"Marvin_Wooldridge4880@iatim.tech",
  //     "username":"Wooldridge Marvin",
  //     "birthDate":"2555-07-05 16:39:41Z",
  //     "basicSalary":"79636454",
  //     "status":"Laboratory Technician",
  //     "group":"LYEuzF",
  //     "description":"Purchasing"
  //     },
  //     { 
  //     "employeeId":"36c24031-d765-49d0-8b8f-8ee316a0a679",
  //     "firstName":"Tom",
  //     "lastName":"Cork",
  //     "email":"Tom_Cork9493@atink.com",
  //     "username":"Cork Tom",
  //     "birthDate":"6207-04-09 19:03:57Z",
  //     "basicSalary":"88294364",
  //     "status":"Designer",
  //     "group":"14kPRm",
  //     "description":"Sales"
  //     },
  //     { 
  //     "employeeId":"15293a68-bdb2-44ae-94e7-fe550a18f9f5",
  //     "firstName":"Enoch",
  //     "lastName":"Palmer",
  //     "email":"Enoch_Palmer1987@womeona.net",
  //     "username":"Palmer Enoch",
  //     "birthDate":"4984-07-27 21:12:18Z",
  //     "basicSalary":"45110289",
  //     "status":"Steward",
  //     "group":"f0ojnd",
  //     "description":"Marketing"
  //     },
  //     { 
  //     "employeeId":"730d7071-e039-4532-af3a-2620208c65c0",
  //     "firstName":"Ivy",
  //     "lastName":"Roberts",
  //     "email":"Ivy_Roberts3102@muall.tech",
  //     "username":"Roberts Ivy",
  //     "birthDate":"5859-09-05 06:50:29Z",
  //     "basicSalary":"84889829",
  //     "status":"Paramedic",
  //     "group":"h6Gb7i",
  //     "description":"Management"
  //     },
  //     { 
  //     "employeeId":"f4a153b0-2f4a-4c63-a1cf-2dbbee6dacc0",
  //     "firstName":"Francesca",
  //     "lastName":"Goodman",
  //     "email":"Francesca_Goodman1884@fuliss.net",
  //     "username":"Goodman Francesca",
  //     "birthDate":"9460-08-23 07:24:56Z",
  //     "basicSalary":"49147988",
  //     "status":"Bellman",
  //     "group":"fSQHIF",
  //     "description":"Finance"
  //     },
  //     { 
  //     "employeeId":"594e598c-31c2-4ef3-ad41-64bcd95c9d90",
  //     "firstName":"Eileen",
  //     "lastName":"Campbell",
  //     "email":"Eileen_Campbell6978@bungar.biz",
  //     "username":"Campbell Eileen",
  //     "birthDate":"6898-03-02 00:05:19Z",
  //     "basicSalary":"77891905",
  //     "status":"Staffing Consultant",
  //     "group":"9E3GP1",
  //     "description":"Purchasing"
  //     },
  //     { 
  //     "employeeId":"22de94ec-6bda-4863-9b2d-79c06138c77a",
  //     "firstName":"Janelle",
  //     "lastName":"Davies",
  //     "email":"Janelle_Davies485@extex.org",
  //     "username":"Davies Janelle",
  //     "birthDate":"2283-01-09 14:47:48Z",
  //     "basicSalary":"97857478",
  //     "status":"Mobile Developer",
  //     "group":"kaxAdK",
  //     "description":"Operations"
  //     }
  //   ];

  //   empDatas.forEach(async(emp:any)=>
  //   {
  //     emp.employeeId = this.empService.generateId();
  //     emp.username = emp.username.split(" ").join("").substring(0, 10);
  //     emp.birthDate = new Date(Math.floor(Math.random() * (end - start + 1) + start)).toISOString();
  //     emp.basicSalary = parseInt(emp.basicSalary.substring(emp.basicSalary.length - 4))*1000;
  //     emp.group = this.groups[Math.floor(Math.random()*this.groups.length)].groupName;
  //     emp.photo = "-";
  //     emp.createdAt = Date.now();

  //     await this.empService.addEmployee(emp);
  //   });
    
      
  // }

  cancel()
  {
    this.router.navigate(['/employee']);
  }


}
