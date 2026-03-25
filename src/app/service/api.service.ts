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

 createUserProfile(data: any) {
    return this.http.post(`${this.dbUrl}/UserDetails.json`, data);
  }

  // Signin(login:any){
  //   return this.http.post(`${this.dbUrl}/login.json`, login)
  // }


updateUserInfo(uid: string, updatedData: any) {
  return this.http.patch(
    `${this.dbUrl}/UserDetails/${uid}.json`, 
    updatedData   
  );
}
}