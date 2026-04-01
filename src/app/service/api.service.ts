import { HttpClient } from '@angular/common/http';
import { Injectable  } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  private dbUrl = 'https://post-6acd9-default-rtdb.firebaseio.com/';

constructor(private http:HttpClient){}          



allUsers(){           
    return this.http.get(`${this.dbUrl}.json`)
}
createUserProfile(uid: string, userObj: any){
  return this.http.put(`${this.dbUrl}/UserDetails/${uid}.json`, userObj);
}
addUser(userObj:any){
  return this.http.post(`${this.dbUrl}/UserDetails.json`, userObj);
}
updateUserInfo(uid: string, updatedData: any) {
  return this.http.patch(
    `${this.dbUrl}/UserDetails/${uid}.json`, 
    updatedData   
  );
}
deleteUser(uid: any){
  // console.log(uid,"service Api Call ");
  
  return this.http.delete(`${this.dbUrl}/UserDetails/${uid}.json`);
}
getUserbyId(uid: string){
  console.log(uid,"getUserprofile");
  
  return this.http.get(`${this.dbUrl}/UserDetails/${uid}.json`);
}
markAttendance(uid: any, date: string, data: any) {
    return this.http.put(`${this.dbUrl}/UserDetails/${uid}/Attendance/${date}.json`, data);
  }
  updateAttendance(uid: any, date: string, data: any) {
    return this.http.patch(`${this.dbUrl}/UserDetails/${uid}/Attendance/${date}.json`, data);
  }
}