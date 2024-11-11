 // Firebase 구성 - 이 부분의 값들이 정확한지 확인해주세요
const firebaseConfig = {
    apiKey: "AIzaSyAUbUzxaSI7SsIIOKt6v65xjpgvZ0boFsA",
    authDomain: "gogo22-73d94.firebaseapp.com",
    projectId: "gogo22-73d94",
    storageBucket: "gogo22-73d94.firebasestorage.app",
    messagingSenderId: "501050728605",
    appId: "1:501050728605:web:96b3ffa2f903ea4540f474",
    measurementId: "G-VSV6RJ0RE2"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
