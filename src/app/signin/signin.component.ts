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

  // ✅ Step 1: Validation FIRST
  if(!this.email || !this.password){
    this.toastr.warning("Please fill all fields ⚠️");
    return;
  }

  try {
    this.loading = true;
    this.spinner.show();

    // ✅ Step 2: Authentication only
    const userAuth = await this.authService.signin(this.email, this.password);

    console.log(userAuth);

    this.toastr.success("Logged in successfully ✅");

    this.ResetForm();

    // ✅ Step 3: Navigate
    this.router.navigate(['/dashboard']);

  } catch (error:any) {

    console.log(error);
    this.toastr.error(error.message || "Login failed ❌");

  } finally {

    // ✅ Step 4: Always stop loader
    this.loading = false;
    this.spinner.hide();
  }
}
ResetForm(){
this.email = '';
this.password=''

}
}
