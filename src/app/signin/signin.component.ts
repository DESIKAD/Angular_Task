import { Component, OnInit } from '@angular/core';
import { ApiService } from '../service/api.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit{

  
    email="";
    password= "";
  loading = false;


  constructor(private apiservice:ApiService,private toastr :ToastrService, private router : Router, private spinner:NgxSpinnerService,private authService:AuthService){}

  ngOnInit() {
  
    }
  

async loginData(){

  if(!this.email || !this.password){
    this.toastr.warning("Please fill all fields ⚠️");
    return;
  }

  try {
    this.loading = true;
    this.spinner.show();

    const userAuth = await this.authService.signin(this.email, this.password);
    const uid = userAuth.user.uid;

    console.log("UID:", uid);

    this.apiservice.getUserbyId(uid).subscribe({

      next: (res:any) => {
        console.log("User Data:", res);

        if(!res){
          this.toastr.error("User data not found ❌");
          this.spinner.hide();
          return;
        }

        localStorage.setItem('user', JSON.stringify({
          uid: uid,
          ...res
        }));

        this.toastr.success("Logged in successfully ✅");

        this.ResetForm();

        this.spinner.hide();

        this.router.navigate(['/dashboard']);
      },

      error: (err) => {
        console.log(err);
        this.toastr.error("Failed to fetch user data ❌");
        this.spinner.hide();
      }

    });

  } catch (error:any) {

    console.log(error);
    this.toastr.error(error.message || "Login failed ❌");

    this.spinner.hide();
    this.loading = false;
  }
}
ResetForm(){
this.email = '';
this.password=''

}
}
