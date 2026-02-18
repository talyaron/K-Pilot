import { getDatabase, ref, onChildAdded, onChildChanged, onChildRemoved, onDisconnect, set, push, DatabaseReference } from 'firebase/database';
import { Group, Quaternion, Vector3 } from 'three';
import { scene } from './scene.ts';
import { loadAirplane } from './planeLoader.ts';

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
import { initializeApp } from 'firebase/app';
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const playersRef = ref(database, 'players');
const bulletsRef = ref(database, 'bullets');
const hitsRef = ref(database, 'hits');

export const players: { [key: string]: Group } = {};
let playerId: string;
let playerRef: DatabaseReference;

export function initMultiplayer(playerAirplane: Group) {
    playerId = Math.random().toString(36).substring(7);
    playerRef = ref(database, 'players/' + playerId);

    set(playerRef, {
        position: playerAirplane.position.toArray(),
        rotation: playerAirplane.rotation.toArray(),
    });

    onDisconnect(playerRef).remove();

    // Clean up old hits and bullets on start
    set(hitsRef, {});
    set(bulletsRef, {});

    onChildAdded(playersRef, async (snapshot) => {
        if (snapshot.key === playerId) return;
        const data = snapshot.val();
        const newPlayer = await loadAirplane();
        newPlayer.position.fromArray(data.position);
        newPlayer.rotation.fromArray(data.rotation);
        players[snapshot.key!] = newPlayer;
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

export function getPlayerId() {
    return playerId;
}


export function updatePlayerPosition(playerAirplane: Group, health?: number) {
    if (playerRef) {
        set(playerRef, {
            position: playerAirplane.position.toArray(),
            rotation: playerAirplane.rotation.toArray(),
            health: health ?? 100,
        });
    }
}

export function fireBullet(position: Vector3, quaternion: Quaternion) {
    push(bulletsRef, {
        playerId,
        position: position.toArray(),
        quaternion: quaternion.toArray(),
    });
}

export function onBulletFired(callback: (data: any) => void) {
    onChildAdded(bulletsRef, (snapshot) => {
        const data = snapshot.val();
        if (data.playerId !== playerId) {
            callback(data);
        }
    });
}

export function reportHit(victimId: string, attackerId: string) {
    push(hitsRef, { victimId, attackerId, damage: 20 });
}

export function onPlayerHit(callback: (victimId: string, attackerId: string, damage: number) => void) {
    onChildAdded(hitsRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.victimId && data.attackerId) {
            callback(data.victimId, data.attackerId, data.damage || 20);
        }
    });
}

export function updatePlayerHealth(health: number) {
    if (playerRef) {
        set(ref(database, 'players/' + playerId + '/health'), health);
    }
}

export function reportKill(killerId: string) {
    push(ref(database, 'kills'), { killerId, timestamp: Date.now() });
}

export function onKillReported(callback: (killerId: string) => void) {
    onChildAdded(ref(database, 'kills'), (snapshot) => {
        const data = snapshot.val();
        if (data && data.killerId) {
            callback(data.killerId);
        }
    });
}