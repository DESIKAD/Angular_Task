import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { ApiService } from '../service/api.service';

@Component({
  selector: 'app-attendence',
  templateUrl: './attendence.component.html',
  styleUrls: ['./attendence.component.scss']
})
export class AttendenceComponent implements OnInit{

  constructor(private apiService:ApiService){}
map: any;

ngOnInit() {
  delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/marker-icon-2x.png',
  iconUrl: 'assets/marker-icon.png',
  shadowUrl: 'assets/marker-shadow.png'
});
}
loadMapWithLocation(){

  if(!navigator.geolocation){
    alert("Geolocation not supported ❌");
    return;
  }

  navigator.geolocation.getCurrentPosition((position) => {

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    // 🔥 Create map
    this.map = L.map('map').setView([lat, lng], 15);

    // 🔥 Load tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // 🔥 Add marker
    L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup("You are here 📍")
      .openPopup();

  }, (error) => {
    console.log(error);
    alert("Location access denied ❌");
  });
}
markAttendance(){

  const user = localStorage.getItem('user');

  if(!user){
    alert("User not logged in ❌");
    return;
  }

  const userData = JSON.parse(user);
  const uid = userData.uid;

  if(!navigator.geolocation){
    alert("Geolocation not supported ❌");
    return;
  }

  navigator.geolocation.getCurrentPosition(

    (position) => {

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const now = new Date();

      const date = now.toISOString().split('T')[0]; // 2026-03-26
      const time = now.toLocaleTimeString();

      const attendanceData = {
        latitude: lat,
        longitude: lng,
        time: time
      };

      this.apiService.markAttendance(uid, date, attendanceData).subscribe({
        next: () => {
          console.log("Attendance marked ✅");
          this.loadMapWithLocation(); // show map after marking
        },
        error: (err) => {
          console.log(err);
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
