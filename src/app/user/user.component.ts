import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ApiService } from '../service/api.service';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

interface AttendanceRecord {
  clockIn: string;
  clockOut: string | null;
  workMode: string;
  note: string;
  status: string;
}
@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})


export class UserComponent implements OnInit, OnDestroy {

  
  AuthUid: string = '';
  DbKey: string = '';
  userName: string = 'Loading...';
  userData: any = null;
  attendanceRecords: any[] = []; // Added missing property

  currentTime: Date = new Date();
  isCheckedIn: boolean = false;
  checkInTime: Date | null = null;
  checkOutTime: Date | null = null;
  workLocation: string = 'Office';
  dailyNote: string = '';

  showCamera: boolean = false;
  capturedImage: string | null = null;
  mediaStream: MediaStream | null = null;

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    setInterval(() => { this.currentTime = new Date(); }, 1000);

    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.AuthUid = user.uid;
        this.fetchCurrentUserData();
      } else {
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

        // 🔥 SEARCH FOR ACTIVE SESSION
        const dateKey = this.currentTime.toISOString().split('T')[0];
        
        if (foundUser.Attendance && foundUser.Attendance[dateKey]) {
          const dailySessions = foundUser.Attendance[dateKey];
          
          // Use Object.entries to get [sessionId, data] pairs
          const sessionEntries = Object.entries(dailySessions);
          
          // Find a session where the status is 'working'
          const activeEntry = sessionEntries.find(([id, record]) => {
            const r = record as AttendanceRecord;
            return r.status === 'working';
          });

          if (activeEntry) {
            const [sessionId, recordData] = activeEntry;
            const record = recordData as AttendanceRecord;

            // Update UI state
            this.isCheckedIn = true;
            this.checkInTime = new Date(`1970-01-01T${record.clockIn}Z`);
            this.workLocation = record.workMode || 'Office';
            this.dailyNote = record.note || '';
            
            // Re-sync the sessionId to localStorage for Clock-Out
            localStorage.setItem('currentSessionId', sessionId);
            
            console.log("Active session restored:", sessionId);
          }
        }
      }
    }
  });
}
  async confirmClockIn() {
    this.isCheckedIn = true;
    this.checkInTime = new Date();
    this.showCamera = false;
    
    const coords = await this.getUserLocation();
    const dateKey = this.currentTime.toISOString().split('T')[0]; 
    const formattedClockIn = this.checkInTime.toTimeString().split(' ')[0];

    const sessionID = new Date().getTime().toString(); 
    localStorage.setItem('currentSessionId', sessionID);

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

    this.apiService.markAttendance(this.DbKey, dateKey, attendanceRecord, sessionID).subscribe({
      next: (res) => console.log('Clock In Saved:', sessionID),
      error: (err) => console.error('Failed to save:', err)
    });
  }

  toggleAttendance() {
    if (!this.isCheckedIn) {
      this.showCamera = true;
      this.startCamera();
    } else {
      this.checkOutTime = new Date();
      this.isCheckedIn = false;
      
      const dateKey = this.currentTime.toISOString().split('T')[0]; 
      const formattedClockOut = this.checkOutTime.toTimeString().split(' ')[0];
      const sessionID = localStorage.getItem('currentSessionId');

      const updateData = {
        clockOut: formattedClockOut,
        status: 'completed'
      };

      if (sessionID) {
        this.apiService.updateAttendance(this.DbKey, dateKey, updateData, sessionID).subscribe({
          next: (res) => {
            console.log('Successfully Clocked Out!');
            localStorage.removeItem('currentSessionId');
            this.dailyNote = ''; 
          },
          error: (err) => console.error('Error clocking out:', err)
        });
      }
    }
  }

  // --- HELPERS ---
  calculateDuration(inTime: string, outTime: string): string {
    if (!inTime || !outTime || inTime === '--:--' || outTime === '--:--') return '-';
    const d1 = new Date(`1970-01-01T${inTime}Z`);
    const d2 = new Date(`1970-01-01T${outTime}Z`);
    let diffMs = d2.getTime() - d1.getTime();
    return diffMs < 0 ? '-' : `${Math.floor(diffMs / 3600000)}h ${Math.floor((diffMs % 3600000) / 60000)}m`;
  }

  getUserLocation(): Promise<{lat: number | null, lng: number | null}> {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve({ lat: null, lng: null })
        );
      } else resolve({ lat: null, lng: null });
    });
  }

  // --- CAMERA METHODS ---
  async startCamera() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setTimeout(() => { if (this.videoElement) this.videoElement.nativeElement.srcObject = this.mediaStream; }, 0);
    } catch (err) {
      alert("Camera access denied");
      this.showCamera = false;
    }
  }

  captureImage() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    this.capturedImage = canvas.toDataURL('image/png');
    this.stopCamera(); 
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }
  retakeImage() { this.capturedImage = null; this.startCamera(); }
  cancelCamera() { this.stopCamera(); this.showCamera = false; this.capturedImage = null; }
}