import { Component, OnInit } from '@angular/core';
import { ApiService } from '../service/api.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  all_data: any[] = [];        
  filteredUsers: any[] = [];    
  showModal = false;
  selectedUser: any = null;

  stats = {
    total: 0,
    admin: 0,
    user: 0,
    general: 0,
    others: 0
  };

  availableSkills = ["Html", "Css", "Javascript", "typescript", "Angular", "MongoDB"];

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private authService:AuthService,
    private router:Router
  ) {}

  ngOnInit() {

    this.allUsersGet();

    setTimeout(() => {
      this.spinner.hide();
    }, 1000);
  }

  allUsersGet(){

    this.apiService.allUsers().subscribe((res:any)=>{
      console.log(res);

      const data = res.UserDetails;
      const keys = Object.keys(data);

      this.all_data = []; 

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        this.all_data.push({
          id: key,
          ...data[key]
        });
      }

      console.log(this.all_data);

      this.filteredUsers = this.all_data;
      this.calculateStats();
    })
  }

  calculateStats() {
    this.stats.total = this.all_data.length;

    this.stats.admin = this.all_data.filter(u => u.role?.toLowerCase() === 'admin').length;
    this.stats.general = this.all_data.filter(u => u.role?.toLowerCase() === 'general').length;
    this.stats.user = this.all_data.filter(u => u.role?.toLowerCase() === 'user').length;

    this.stats.others =
      this.stats.total - (this.stats.admin + this.stats.general + this.stats.user);
  }

  filterByRole(role: string) {
    const searchRole = role.toLowerCase();

    if (searchRole === 'all') {
      this.filteredUsers = this.all_data;
    } else if (searchRole === 'others') {
      this.filteredUsers = this.all_data.filter(u => {
        const r = u.role?.toLowerCase();
        return r !== 'admin' && r !== 'general' && r !== 'user';
      });
    } else {
      this.filteredUsers = this.all_data.filter(
        u => u.role?.toLowerCase() === searchRole
      );
    }
  }

  // hasSkill(skill: string): boolean {
  //   return this.selectedUser?.skills?.includes(skill) || false;
  // }

  hasSkill(skill: string): boolean {
  return this.selectedUser?.skills?.some(
    (s: string) => s.toLowerCase() === skill.toLowerCase()
  ) || false;
}

 toggleModalSkill(event: any, skill: string) {
  if (!this.selectedUser.skills) {
    this.selectedUser.skills = [];
  }

  if (event.target.checked) {
    // avoid duplicate
    if (!this.hasSkill(skill)) {
      this.selectedUser.skills.push(skill);
    }
  } else {
    this.selectedUser.skills =
      this.selectedUser.skills.filter(
        (s: string) => s.toLowerCase() !== skill.toLowerCase()
      );
  }
}

  openEditModal(user: any) {
    this.selectedUser = { ...user };
    this.showModal = true;
  }

 saveChanges() {
      this.spinner.show();

  const { id, ...dataToSave } = this.selectedUser;

  this.apiService.updateUserInfo(id, dataToSave).subscribe({

    next: () => {
      this.toastr.success('User updated successfully!');
      this.showModal = false;

      this.allUsersGet();
            this.spinner.hide();

    },

    error: (err) => {
      console.log(err);
      this.toastr.error('Update failed');
    }

  });
}

logout(){

  this.authService.logout().then(() => {

    this.toastr.success("Logged out successfully 👋");

    this.router.navigate(['/signin']);

  }).catch((err:any) => {

    console.log(err);
    this.toastr.error("Logout failed ❌");

  });

}
}