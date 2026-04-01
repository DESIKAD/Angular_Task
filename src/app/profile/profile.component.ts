import { Component, OnInit } from '@angular/core';
import { ApiService } from '../service/api.service';
import { getAuth,onAuthStateChanged  } from 'firebase/auth';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit{
UserId:string='';
UserData:any;

constructor(private apiService:ApiService, private authService:AuthService){}
  ngOnInit(){

  const auth = getAuth();

  onAuthStateChanged(auth, (user) => {

    if(user){
      this.UserId = user.uid;
      this.getProfileData(); 
    } else {
      console.log("No user logged in");
    }

  });
}

getProfileData(){
  this.apiService.allUsers().subscribe((res:any)=>{

    const data = res.UserDetails;
    const users = Object.values(data);

    const currentUser = users.find((u:any) => u.uid === this.UserId);

    console.log("Found user:", currentUser);

    this.UserData = currentUser;
  });
}

}
