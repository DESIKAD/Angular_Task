import { Component, OnInit } from '@angular/core';
import { ApiService } from '../service/api.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';
import { user } from '@angular/fire/auth';

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

  newUser = {
  name: '',
  email: '',
  role: '',
  skills: [] as string[]
};

showAddModal = false;

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
  this.authService.logout().then(()=>{
    localStorage.removeItem('user');
    this.router.navigate(['/signin']);
  });
}
deleteUser(userId: any){

  if(!confirm("Are you sure you want to delete this user? ❗")){
    return;
  }

  this.spinner.show();

  this.apiService.deleteUser(userId.id).subscribe({

    next: (del:any ) => {
      console.log(del,"Delete");
      if(del == null){

    this.toastr.success("Deleted Successfully!");
    this.allUsersGet();
      this.spinner.hide();
      }
    },

    error: (err) => {
      console.log(err);
      this.toastr.error("Delete failed ❌");
      this.allUsersGet();
          this.spinner.hide();

    }

  });
  this.allUsersGet();
}

addUser(){

  if(!this.newUser.name || !this.newUser.email){
    this.toastr.warning("Please fill required fields ⚠️");
    return;
  }

  this.spinner.show();

  this.apiService.addUser(this.newUser).subscribe({

    next: () => {
      this.toastr.success("User added successfully ✅");

      this.showAddModal = false;
      this.resetAddUserForm();

      this.allUsersGet(); 
      this.spinner.hide();
    },

    error: (err) => {
      console.log(err);
      this.toastr.error("Failed to add user ❌");
      this.spinner.hide();
    }

  });
}

toggleNewUserSkill(event:any, skill:string){

  if(event.target.checked){
    this.newUser.skills.push(skill);
  } else {
    this.newUser.skills =
      this.newUser.skills.filter(s => s !== skill);
  }
}

resetAddUserForm(){
  this.newUser = {
    name: '',
    email: '',
    role: '',
    skills: []
  };
}

// Add these new state variables to keep track of filters
  searchQuery: string = '';
  currentRoleFilter: string = 'all';

  // 1. The Search Function
  searchUsers(event: any) {
    this.searchQuery = event.target.value.toLowerCase();
    this.applyFilters();
  }

  // 2. Update your existing filterByRole to use the combined logic
  searchfilterByRole(role: string) {
    this.currentRoleFilter = role.toLowerCase();
    this.applyFilters();
  }

  // 3. The Master Filter Function (Handles both Search AND Role)
  applyFilters() {
    this.filteredUsers = this.all_data.filter(user => {
      
      // Check Role
      let matchesRole = true;
      if (this.currentRoleFilter !== 'all') {
        const r = user.role?.toLowerCase() || '';
        if (this.currentRoleFilter === 'others') {
          matchesRole = r !== 'admin' && r !== 'general' && r !== 'user';
        } else {
          matchesRole = r === this.currentRoleFilter;
        }
      }

      // Check Search Query (Name)
      let matchesSearch = true;
      if (this.searchQuery) {
        matchesSearch = user.name?.toLowerCase().includes(this.searchQuery);
      }

      return matchesRole && matchesSearch;
    });
  }

  // 4. The Stats Function (Replaces document.getElementById)
  // Note: You actually already had this as calculateStats(), 
  // but here it is matching your exact requested categories!
  updateStats() {
    this.stats.total = this.all_data.length;
    this.stats.user = this.all_data.filter(u => u.role?.toLowerCase() === 'user').length;
    this.stats.admin = this.all_data.filter(u => u.role?.toLowerCase() === 'admin').length;
    this.stats.general = this.all_data.filter(u => u.role?.toLowerCase() === 'general').length;
    
    // Others is whatever is left over
    this.stats.others = this.stats.total - (this.stats.admin + this.stats.general + this.stats.user);
  }
// deleteUser(data:any){
//   this.spinner.show();
// this.apiService.deleteUser(data).subscribe((data:any)=>{
//   console.log(data);
//   if(data == null){
//     this.toastr.success("Deleted Successfully!");
//         this.allUsersGet();

//     this.spinner.hide()
//   }else{
//     this.toastr.error("Something Went worng!!!!");
//         this.allUsersGet();
//     this.spinner.hide()
//   }
// })
// console.log(data,"userId",);

// }
}