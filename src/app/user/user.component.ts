import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ApiService } from '../service/api.service';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // 1. Import Firebase Auth

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit, OnDestroy {

  // --- Real-time User Data Variables ---
  AuthUid: string = '';    // The Firebase Authentication UID
  DbKey: string = '';      // The Realtime Database Node Key (e.g., -Nx...)
  userName: string = 'Loading...'; 
  userData: any = null;
  
  // --- Time & Attendance Variables ---
  currentTime: Date = new Date();
  isCheckedIn: boolean = false;
  checkInTime: Date | null = null;
  checkOutTime: Date | null = null;
  workLocation: string = 'Office';
  dailyNote: string = '';

  // --- Camera Variables ---
  showCamera: boolean = false;
  capturedImage: string | null = null;
  mediaStream: MediaStream | null = null;

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    // 1. Keep the live clock ticking
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    // 2. Real-time Auth Listener (Same as your Profile logic!)
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.AuthUid = user.uid;
        this.fetchCurrentUserData(); // Fetch data once we know who is logged in
      } else {
        console.log("No user logged in");
        this.userName = 'Guest';
      }
    });
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  fetchCurrentUserData() {
    this.apiService.allUsers().subscribe((res: any) => {
      if (res && res.UserDetails) {
        const data = res.UserDetails;
        const dbKeys = Object.keys(data); 
        
        let foundUser = null;
        let foundDbKey = '';

        // Loop through to find the user matching our Auth UID
        for (const key of dbKeys) {
          if (data[key].uid === this.AuthUid) {
            foundUser = data[key];
            foundDbKey = key; 
            break;
          }
        }

        if (foundUser) {
          this.userData = foundUser;
          this.userName = foundUser.name; 
          this.DbKey = foundDbKey;        

          // 🔥 NEW LOGIC: Check Firebase for today's status!
          const dateKey = this.currentTime.toISOString().split('T')[0]; // Gets 'YYYY-MM-DD'
          
          // Does the user have an attendance folder for today?
          if (foundUser.Attendance && foundUser.Attendance[dateKey]) {
            const todaysRecord = foundUser.Attendance[dateKey];
            
            // If they have a clockIn but NO clockOut, they are still working!
            if (todaysRecord.clockIn && !todaysRecord.clockOut) {
              this.isCheckedIn = true; // Flips the UI to "Clocked In"
              
              // Restore their data from Firebase back to the UI
              this.checkInTime = new Date(todaysRecord.clockIn); // Converts your timestamp back to a Date object
              this.workLocation = todaysRecord.workMode || 'Office';
              this.dailyNote = todaysRecord.note || '';
            } 
            // If they already clocked out today, it safely stays false.
          }

          console.log("Attendance user ready:", this.userData);
        } else {
          this.userName = 'Unknown User';
        }
      }
    });
  }

  // --- GEOLOCATION HELPER ---
  getUserLocation(): Promise<{lat: number | null, lng: number | null}> {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
          (error) => resolve({ lat: null, lng: null })
        );
      } else {
        resolve({ lat: null, lng: null });
      }
    });
  }

  // --- CLOCK OUT LOGIC ---
 toggleAttendance() {
    if (!this.isCheckedIn) {
      this.showCamera = true;
      this.startCamera();
    } else {
      this.checkOutTime = new Date();
      this.isCheckedIn = false;
      this.dailyNote = ''; 
      
      const dateKey = this.currentTime.toISOString().split('T')[0]; 
      
      // 🔥 Get the exact 00:00:00 format
      const formattedClockOut = this.checkOutTime.toTimeString().split(' ')[0];

      const updateData = {
        clockOut: formattedClockOut, // <--- Send the formatted string here
        status: 'completed'
      };

this.apiService.updateAttendance(this.DbKey, dateKey, updateData).subscribe({
        next: (res) => {
          console.log('Successfully Clocked Out!', res);
        },
        error: (err) => {
          console.error('Error clocking out:', err);
        }
      });    }
  }

async confirmClockIn() {
    this.isCheckedIn = true;
    this.checkInTime = new Date();
    this.showCamera = false;
    
    const coords = await this.getUserLocation();
    const dateKey = this.currentTime.toISOString().split('T')[0]; 
    
    const formattedClockIn = this.checkInTime.toTimeString().split(' ')[0];

    const attendanceRecord = {
      name: this.userName, 
      date: dateKey,
      clockIn: formattedClockIn, 
      clockOut: null, 
      workMode: this.workLocation, 
      note: this.dailyNote,
      status: 'working',
      photoBase64: this.capturedImage, 
      gpsLocation: coords 
    };

this.apiService.markAttendance(this.DbKey, dateKey, attendanceRecord).subscribe({
      next: (res) => {
        console.log('Clock In Saved to Firebase!', res);
      },
      error: (err) => {
        console.error('Failed to save to Firebase:', err);
      }
    });  }

  // --- CAMERA METHODS (Unchanged) ---
  async startCamera() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setTimeout(() => {
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
        }
      }, 0);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please allow camera permissions in your browser.");
      this.showCamera = false;
    }
  }

  captureImage() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    this.capturedImage = canvas.toDataURL('image/png');
    this.stopCamera(); 
  }

  retakeImage() {
    this.capturedImage = null;
    this.startCamera();
  }

  cancelCamera() {
    this.stopCamera();
    this.showCamera = false;
    this.capturedImage = null;
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  
}