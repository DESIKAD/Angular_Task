import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../service/auth.service';
import { ApiService } from '../service/api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit  {
 previewUrl: SafeUrl | string = '';
name='';
email = '';
password='';
gender ='';
phone_no='';
role ='';
profile_img='';
avaliable_Skill =["Html","CSS","Javascript","typescript","Angular","MongoDB"];
skills:String[] = [];


constructor(private sanitizer: DomSanitizer,private toastr: ToastrService,private authService: AuthService,
  private apiService: ApiService, private spinner: NgxSpinnerService,private router:Router) {}

  ngOnInit(): void { 
  }

async OnSubmit() {
  try {

                     this.spinner.show();

    // 1. Handle Authentication first
    const userAuth = await this.authService.register(this.email, this.password);
    const uid = userAuth.user.uid;

    // 2. Prepare the object
    const userObj = {
      uid: uid, 
      name: this.name,
      email: this.email,
      skills: this.skills, 
      phone_no:this.phone_no,
      profile_img: this.profile_img,
      role: this.role,
      password:this.password
    };

      this.apiService.createUserProfile(uid, userObj).subscribe({
 next: () => {
    console.log("Saved with UID");
         
        this.toastr.success('Profile created successfully!', 'Success');
        this.resetForm();

                     this.router.navigate(['/signin']);
                     this.spinner.hide()

      },
    error: (err) => {
        this.toastr.error('Failed to save profile data', 'API Error');
              this.spinner.hide();

      }
    });

  } catch (error: any) {
    this.toastr.error(error.message, 'Auth Error');
    this.spinner.hide()
  }
}


resetForm() {
  this.name = '';
  this.email = '';
  this.password = '';
  this.phone_no = '';
  this.gender = '';
  this.role = '';
  this.skills = [];
}
Onchecked(event: any, skillName: string) {
  let isChecked = event.target.checked;
  if (isChecked) {
    this.skills.push(skillName);
  } else {
    this.skills = this.skills.filter(a => a != skillName);
  }
}


onFileChange(event: any) {
  const file = event.target.files[0];
  if (file) {
    const unsafeUrl = URL.createObjectURL(file);
    
    this.previewUrl = this.sanitizer.bypassSecurityTrustUrl(unsafeUrl);
    
    this.profile_img = unsafeUrl; 

    console.log("Local Path assigned:", this.profile_img);
  }
}


}
