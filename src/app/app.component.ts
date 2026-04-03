import { Component, OnInit } from '@angular/core';
import { AuthService } from './service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'myapp';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Initial role check
    this.updateUserRole();
  }

  // Getter to pull the role directly from localStorage whenever the UI checks
  get userRole(): string {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role || 'User';
  }

  updateUserRole() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // You can add extra logic here if needed when the app boots
  }

  showSidebar(): boolean {
    const hiddenRoutes = ['/signin', '/home', '/login', '/register', '/'];
    
    // Check if current route is in the hidden list
    const isHidden = hiddenRoutes.includes(this.router.url);
    
    // Safety check: If we are on a hidden route, we don't care about the role.
    // If we are NOT on a hidden route, the sidebar HTML will use 'userRole' getter.
    return !isHidden;
  }

  logout() {
    this.authService.logout().then(() => {
      localStorage.removeItem('user');
      localStorage.removeItem('currentSessionId'); // Clean up attendance session too
      this.router.navigate(['/signin']); 
    }).catch(error => {
      console.error('Logout failed: ', error);
    });
  }
}