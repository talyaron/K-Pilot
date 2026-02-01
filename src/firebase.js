import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onChildAdded, onChildChanged, onChildRemoved, onDisconnect, set } from 'firebase/database';
import { scene } from './scene.js';
import { createAirplane } from './airplane.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDl1OK1RAnBwbdWxEwlgZv869agSQn-mlQ",
    authDomain: "project-keco.firebaseapp.com",
    databaseURL: "https://project-keco-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "project-keco",
    storageBucket: "project-keco.firebasestorage.app",
    messagingSenderId: "859756799800",
    appId: "1:859756799800:web:1e500da3e8a8cbcd4f83cd",
    measurementId: "G-ZR83Y597DN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const playersRef = ref(database, 'players');

const players = {};
let playerId;
let playerRef;

export function initMultiplayer(playerAirplane) {
    playerId = Math.random().toString(36).substring(7);
    playerRef = ref(database, 'players/' + playerId);

    set(playerRef, {
        position: playerAirplane.position.toArray(),
        rotation: playerAirplane.rotation.toArray(),
    });
    
    onDisconnect(playerRef).remove();

    onChildAdded(playersRef, (snapshot) => {
        if (snapshot.key === playerId) return;
        const data = snapshot.val();
        const newPlayer = createAirplane();
        newPlayer.position.fromArray(data.position);
        newPlayer.rotation.fromArray(data.rotation);
        players[snapshot.key] = newPlayer;
        scene.add(newPlayer);
    });

    onChildChanged(playersRef, (snapshot) => {
        if (snapshot.key === playerId) return;
        const data = snapshot.val();
        const player = players[snapshot.key];
        if (player) {
            player.position.fromArray(data.position);
            player.rotation.fromArray(data.rotation);
        }
    });

    onChildRemoved(playersRef, (snapshot) => {
        if (snapshot.key === playerId) return;
        const player = players[snapshot.key];
        if (player) {
            scene.remove(player);
            delete players[snapshot.key];
        }
    });
}

export function updatePlayerPosition(playerAirplane) {
    if (playerRef) {
        set(playerRef, {
            position: playerAirplane.position.toArray(),
            rotation: playerAirplane.rotation.toArray(),
        });
    }
}