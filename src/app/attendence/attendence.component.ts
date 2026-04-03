import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { ApiService } from '../service/api.service';

@Component({
  selector: 'app-attendence',
  templateUrl: './attendence.component.html',
  styleUrls: ['./attendence.component.scss']
})
export class AttendenceComponent implements OnInit {

  constructor(private apiService: ApiService) { }
  map: any;

  ngOnInit() {
    // Fix for Leaflet default marker icons in Angular
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png'
    });
  }

  loadMapWithLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported ❌");
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // 🔥 FIX: Check if map already exists to prevent "Map container is already initialized" error
      if (this.map) {
        this.map.remove();
      }

      this.map = L.map('map').setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(this.map);

      L.marker([lat, lng])
        .addTo(this.map)
        .bindPopup("You are here 📍")
        .openPopup();

    }, (error) => {
      console.error(error);
      alert("Location access denied ❌");
    });
  }

  markAttendance() {
    const user = localStorage.getItem('user');

    if (!user) {
      alert("User not logged in ❌");
      return;
    }

    const userData = JSON.parse(user);
    const uid = userData.uid;

    if (!navigator.geolocation) {
      alert("Geolocation not supported ❌");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const now = new Date();

        const date = now.toISOString().split('T')[0]; // e.g., "2026-04-03"
        const time = now.toLocaleTimeString();
        
        // 🔥 1. Generate a unique Session ID (Timestamp)
        const sessionID = now.getTime().toString(); 

        const attendanceData = {
          latitude: lat,
          longitude: lng,
          time: time,
          status: 'present'
        };

        // 🔥 2. Pass the 4th argument (sessionID) to the service
        this.apiService.markAttendance(uid, date, attendanceData, sessionID).subscribe({
          next: () => {
            console.log("Attendance marked with unique session ID ✅");
            
            // Save current session ID in case you need it for clock-out later
            localStorage.setItem('lastSessionId', sessionID);
            
            this.loadMapWithLocation(); 
          },
          error: (err) => {
            console.error("Firebase Error:", err);
            alert("Failed to mark attendance. Check console.");
          }
        });
      },
      (error) => {
        console.log(error);
        alert("Location access denied ❌");
      }
    );
  }
}