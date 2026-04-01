import { Component } from '@angular/core';
import { AuthService } from './service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'myapp';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // This function checks the current URL to decide if the sidebar should show
  showSidebar(): boolean {
    // Add any exact route paths here where you DO NOT want the sidebar
    const hiddenRoutes = ['/signin', '/home', '/login', '/register'];
    
    // Returns false if the current URL is in the hiddenRoutes array
    return !hiddenRoutes.includes(this.router.url);
  }

  logout() {
    this.authService.logout().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['/signin']); 
    }).catch(error => {
      console.error('Logout failed: ', error);
    });
  }
}
