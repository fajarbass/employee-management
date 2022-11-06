import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { map } from 'rxjs/operators';
import { Employee } from '../models/employee';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  constructor
  (
    private db: AngularFireDatabase
  ) { }

  getAllEmployees()
  {
    return this.db.list<Employee>('/employees').snapshotChanges()
    .pipe(
      map(changes => 
        changes.map(c => ({ key: c.payload.key, ...c.payload.val() }))
      )
    );
  }

  getEmployee(id:string)
  {
     return this.db.object<Employee>(`employees/${id}`).valueChanges();
  }

  checkUsernameAvailablity(username:string) 
  {
    return this.db.database.ref().child("employees").orderByChild('username').equalTo(username).get();
  }

  checkEmailAvailablity(email:string) 
  {
    return this.db.database.ref().child("employees").orderByChild('email').equalTo(email).get();
  }

  generateId()
  {
    return this.db.createPushId();
  }

  addEmployee(data:any)
  {
    return this.db.object<Employee>(`employees/${data.employeeId}`).set(data);
  }

  updateEmployee(id:string, data:any)
  {
    return this.db.object<Employee>(`employees/${id}`).update(data);
  }

  deleteEmployee(id:string)
  {
    return this.db.object(`employees/${id}`).remove();
  }
}
