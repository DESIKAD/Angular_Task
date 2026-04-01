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
    const dateKey = new Date().toISOString().split('T')[0]; // e.g. "2026-03-27"

    this.apiService.allUsers().subscribe({
      next: (res: any) => {
        this.attendanceRecords = []; // Clear array

        if (res && res.UserDetails) {
          const usersData = Object.values(res.UserDetails);

          // Loop through every user in the database
          usersData.forEach((user: any) => {
            // Check if they have an attendance record for TODAY
            if (user.Attendance && user.Attendance[dateKey]) {
              const record = user.Attendance[dateKey];

              this.attendanceRecords.push({
                name: record.name,
                id: user.uid ? user.uid.substring(0, 8).toUpperCase() : 'N/A', // Shortened ID
                clockIn: record.clockIn || '--:--',
                clockOut: record.clockOut || '--:--',
                duration: this.calculateDuration(record.clockIn, record.clockOut),
                overtime: '-', // You can add logic for this later
                picture: record.photoBase64,
                workMode: record.workMode || 'Office',
                gpsLocation: record.gpsLocation,
                note: record.note || 'No notes provided',
                status: record.clockIn > '09:30:00' ? 'late' : 'on-time' // Flags late if after 9:30 AM
              });
            }
          });
        }
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

  // --- PHOTO HELPER ---
  viewPhoto(base64Str: string) {
    if (base64Str) {
      // Opens the base64 image in a new tab
      const win = window.open();
      win?.document.write(`<img src="${base64Str}" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">`);
    } else {
      alert("No photo available for this record.");
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
}
