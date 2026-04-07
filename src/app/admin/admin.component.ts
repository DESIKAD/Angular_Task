import { Component, OnInit } from '@angular/core';
import { ApiService } from '../service/api.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit{

 currentDate: string = '';
  attendanceRecords: any[] = [];

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    // Set today's date for the header
    const today = new Date();
    this.currentDate = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    
    this.fetchTodaysAttendance();
  }

fetchTodaysAttendance() {
  const dateKey = new Date().toISOString().split('T')[0];

  this.apiService.allUsers().subscribe({
    next: (res: any) => {
      const allSessions: any[] = []; 

      if (res && res.UserDetails) {
        const usersData = Object.values(res.UserDetails);

        usersData.forEach((user: any) => {
          if (user.Attendance && user.Attendance[dateKey]) {
            const dailyData = user.Attendance[dateKey];

            // 1. Check if dailyData is a collection of sessions or just one record
            // If it has 'clockIn' or 'time' directly, it's a single (old) record.
            let sessions: any[] = [];
            
            if (dailyData.clockIn || dailyData.time) {
              sessions = [dailyData]; // Wrap single record in an array
            } else {
              sessions = Object.values(dailyData); // It's the new multi-session format
            }

            // 2. Loop through the sessions found for THIS user
            sessions.forEach((record: any) => {
              // We check multiple keys (clockIn OR time) to make sure we don't get --:--
              const startTime = record.clockIn || record.time || '--:--';
              const endTime = record.clockOut || '--:--';

              allSessions.push({
                name: record.name || user.name || 'Unknown',
                id: user.uid ? user.uid.substring(0, 8).toUpperCase() : 'N/A',
                clockIn: startTime,
                clockOut: endTime,
                duration: this.calculateDuration(startTime, endTime),
                overtime: '-',
                picture: record.photoBase64,
                workMode: record.workMode || 'Office',
                // Handle different GPS formats
                gpsLocation: record.gpsLocation || { lat: record.latitude, lng: record.longitude },
                note: record.note || 'No notes',
                status: record.status || (startTime > '09:30:00' ? 'late' : 'on-time')
              });
            });
          }
        });
      }
      
      this.attendanceRecords = allSessions;
    },
    error: (err) => console.error("Error fetching attendance:", err)
  });
}
  // --- MAP HELPER ---
  openMap(lat: number | null, lng: number | null) {
    if (lat && lng) {
      // Opens Google Maps in a new tab with a pin at their exact coordinates!
      const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(mapUrl, '_blank');
    } else {
      alert("GPS location was not captured for this user (Permission Denied).");
    }
  }



  // --- TIME MATH HELPER ---
  calculateDuration(inTime: string, outTime: string): string {
    if (!inTime || !outTime) return '-';
    
    // Parse "HH:mm:ss" strings into date objects to do math
    const d1 = new Date(`1970-01-01T${inTime}Z`);
    const d2 = new Date(`1970-01-01T${outTime}Z`);
    
    let diffMs = d2.getTime() - d1.getTime();
    if (diffMs < 0) return '-'; // Prevent weird bugs

    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    
    return `${hours}h ${minutes}m`;
  }


  // Add these variables to your class
showPhotoModal: boolean = false;
selectedPhoto: string = '';

// Update the viewPhoto helper
viewPhoto(base64Str: string) {
  if (base64Str) {
    this.selectedPhoto = base64Str;
    this.showPhotoModal = true;
  } else {
    alert("No photo available for this record.");
  }
}

closePhotoModal() {
  this.showPhotoModal = false;
  this.selectedPhoto = '';
}
}
