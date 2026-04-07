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
  
  // New state for mobile menu toggle
  isSidebarOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Basic initialization
  }

  /**
   * Toggle the sidebar open/closed on mobile
   */
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /**
   * Closes the sidebar (useful when clicking a link on mobile)
   */
  closeSidebar() {
    this.isSidebarOpen = false;
  }

  /**
   * Getter to pull the role directly from localStorage
   */
  get userRole(): string {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.role || 'User';
      } catch (e) {
        return 'User';
      }
    }
    return 'User';
  }

  /**
   * Determines if the sidebar should be rendered based on the route
   */
  showSidebar(): boolean {
    const hiddenRoutes = ['/signin', '/home', '/login', '/register', '/'];
    // Return true if the current URL is NOT in the hiddenRoutes list
    return !hiddenRoutes.includes(this.router.url);
  }

  /**
   * Handles user logout and cleanup
   */
  logout() {
    this.authService.logout().then(() => {
      // Clear local storage items
      localStorage.removeItem('user');
      localStorage.removeItem('currentSessionId');
      
      // Reset sidebar state for next login
      this.isSidebarOpen = false;
      
      // Redirect to signin
      this.router.navigate(['/signin']); 
    }).catch(error => {
      console.error('Logout failed: ', error);
    });
  }

  
}