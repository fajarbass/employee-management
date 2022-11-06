import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { EmployeeService } from 'src/app/services/employee.service';

@Component({
  selector: 'app-employee-detail',
  templateUrl: './employee-detail.page.html',
  styleUrls: ['./employee-detail.page.scss'],
  providers:[EmployeeService]
})
export class EmployeeDetailPage {

  employeeId:string;
  emp:any;
  empSubs:Subscription;

  constructor
  (
    private route: ActivatedRoute,
    private empSrvc: EmployeeService,
  ) { }

  ionViewWillEnter()
  {
    this.employeeId = this.route.snapshot.params['employeeId'];
    if(this.employeeId) this.loadEmployee(); console.log(this.employeeId);
  }

  loadEmployee()
  {
    this.empSubs = this.empSrvc.getEmployee(this.employeeId).subscribe((res)=>{
      this.emp = res;
      
    });
  }

  ionViewWillLeave()
  {
    if(this.empSubs) this.empSubs.unsubscribe();
  }

}
