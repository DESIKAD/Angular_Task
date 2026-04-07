import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../service/api.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // --- UI State ---
  isMenuOpen = false;
  showModal = false;
  showAddModal = false;
  searchQuery = '';
  currentRoleFilter = 'all';
  private destroy$ = new Subject<void>();

  // --- Data ---
  all_data: any[] = [];
  filteredUsers: any[] = [];
  selectedUser: any = null;

  stats = { total: 0, admin: 0, user: 0, general: 0, others: 0 };

  // --- Extended New User Model ---
  newUser = {
    name: '',
    email: '',
    password: '',
    gender: '',
    phone_no: '',
    role: '',
    profile_img: '' as string | ArrayBuffer | null,
    skills: [] as string[]
  };

  availableSkills = ["Html", "CSS", "Javascript", "typescript", "Angular", "MongoDB"];

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.allUsersGet();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- API Methods ---
  allUsersGet() {
    this.spinner.show();
    this.apiService.allUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const data = res.UserDetails || {};
          this.all_data = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));

          this.updateStats();
          this.applyFilters();
          this.spinner.hide();
        },
        error: () => {
          this.toastr.error("Failed to load users");
          this.spinner.hide();
        }
      });
  }

  // --- Image Handling ---
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newUser.profile_img = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // --- Filtering & Stats ---
  searchUsers(event: any) {
    this.searchQuery = event.target.value.toLowerCase();
    this.applyFilters();
  }

  searchfilterByRole(role: string) {
    this.currentRoleFilter = role.toLowerCase();
    this.applyFilters();
  }

  applyFilters() {
    const query = this.searchQuery;
    this.filteredUsers = this.all_data.filter(user => {
      const r = user.role?.toLowerCase() || '';
      const matchesRole = this.currentRoleFilter === 'all' 
        ? true 
        : this.currentRoleFilter === 'others'
          ? !['admin', 'general', 'user'].includes(r)
          : r === this.currentRoleFilter;

      const matchesSearch = !query || 
        user.name?.toLowerCase().includes(query) || 
        user.email?.toLowerCase().includes(query);

      return matchesRole && matchesSearch;
    });
  }

  updateStats() {
    this.stats.total = this.all_data.length;
    this.stats.user = this.all_data.filter(u => u.role?.toLowerCase() === 'user').length;
    this.stats.admin = this.all_data.filter(u => u.role?.toLowerCase() === 'admin').length;
    this.stats.general = this.all_data.filter(u => u.role?.toLowerCase() === 'general').length;
    this.stats.others = this.stats.total - (this.stats.admin + this.stats.general + this.stats.user);
  }

  // --- User Actions ---
  addUser() {
    if (!this.newUser.name || !this.newUser.email || !this.newUser.password) {
      this.toastr.warning("Name, Email, and Password are required! ⚠️");
      return;
    }
    this.spinner.show();
    this.apiService.addUser(this.newUser).subscribe({
      next: () => {
        this.toastr.success("User registered successfully ✅");
        this.showAddModal = false;
        this.resetAddUserForm();
        this.allUsersGet();
      },
      error: () => {
        this.toastr.error("Registration failed ❌");
        this.spinner.hide();
      }
    });
  }

  deleteUser(userId: any) {
    if (!confirm("Are you sure you want to delete this user? ❗")) return;
    
    this.spinner.show();
    this.apiService.deleteUser(userId.id).subscribe({
      next: () => {
        this.toastr.success("Deleted Successfully!");
        this.allUsersGet();
      },
      error: () => {
        this.toastr.error("Delete failed ❌");
        this.spinner.hide();
      }
    });
  }

  openEditModal(user: any) {
    this.selectedUser = JSON.parse(JSON.stringify(user)); // Deep copy to avoid instant binding
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
      },
      error: () => {
        this.toastr.error('Update failed');
        this.spinner.hide();
      }
    });
  }

  // --- Helpers ---
hasSkill(skill: string): boolean {
  if (!this.selectedUser || !this.selectedUser.skills) return false;
  return this.selectedUser.skills.some(
    (s: string) => s.toLowerCase() === skill.toLowerCase()
  );
}

toggleSkill(target: 'new' | 'edit', skill: string) {
  const user = target === 'new' ? this.newUser : this.selectedUser;
  
  if (!user.skills) user.skills = [];

  const index = user.skills.indexOf(skill);
  if (index > -1) {
    // If skill exists, remove it (uncheck)
    user.skills.splice(index, 1);
  } else {
    // If skill doesn't exist, add it (check)
    user.skills.push(skill);
  }
}

  resetAddUserForm() {
    this.newUser = {
      name: '', email: '', password: '', gender: '',
      phone_no: '', role: '', profile_img: '', skills: []
    };
  }

  logout() {
    this.authService.logout().then(() => {
      localStorage.clear();
      this.toastr.success("Logged out successfully 👋");
      this.router.navigate(['/signin']);
    }).catch(() => this.toastr.error("Logout failed ❌"));
  }
}