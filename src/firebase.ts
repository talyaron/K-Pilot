import { getDatabase, ref, onChildAdded, onChildChanged, onChildRemoved, onDisconnect, set, push, remove, get, DatabaseReference } from 'firebase/database';
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
const killsRef = ref(database, 'kills');

export const players: { [key: string]: Group } = {};
let playerId: string;
let playerRef: DatabaseReference;
let joinTimestamp: number;

export function initMultiplayer(playerAirplane: Group) {
    playerId = Math.random().toString(36).substring(7);
    playerRef = ref(database, 'players/' + playerId);
    joinTimestamp = Date.now();

    set(playerRef, {
        position: playerAirplane.position.toArray(),
        rotation: playerAirplane.rotation.toArray(),
        quaternion: playerAirplane.quaternion.toArray(),
        health: 100,
        lastSeen: Date.now(),
    });

    onDisconnect(playerRef).remove();

    // Clean up stale players (not updated in last 30 seconds)
    get(playersRef).then((snapshot) => {
        if (snapshot.exists()) {
            const now = Date.now();
            snapshot.forEach((child) => {
                if (child.key === playerId) return;
                const data = child.val();
                if (!data.lastSeen || now - data.lastSeen > 30000) {
                    remove(ref(database, 'players/' + child.key));
                }
            });
        }
    });

    // Clean up old hits and kills (older than 30 seconds)
    get(hitsRef).then((snapshot) => {
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const data = child.val();
                if (!data.timestamp || Date.now() - data.timestamp > 30000) {
                    remove(ref(database, 'hits/' + child.key));
                }
            });
        }
    });

    get(killsRef).then((snapshot) => {
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const data = child.val();
                if (!data.timestamp || Date.now() - data.timestamp > 30000) {
                    remove(ref(database, 'kills/' + child.key));
                }
            });
        }
    });

    onChildAdded(playersRef, async (snapshot) => {
        if (snapshot.key === playerId) return;
        const data = snapshot.val();
        const newPlayer = await loadAirplane();
        newPlayer.position.fromArray(data.position);
        if (data.quaternion) {
            newPlayer.quaternion.fromArray(data.quaternion);
        } else {
            newPlayer.rotation.fromArray(data.rotation);
        }
        players[snapshot.key!] = newPlayer;
        scene.add(newPlayer);
    });

    onChildChanged(playersRef, (snapshot) => {
        if (snapshot.key === playerId) return;
        const data = snapshot.val();
        const player = players[snapshot.key!];
        if (player) {
            player.position.fromArray(data.position);
            if (data.quaternion) {
                player.quaternion.fromArray(data.quaternion);
            } else {
                player.rotation.fromArray(data.rotation);
            }
        }
    });

    onChildRemoved(playersRef, (snapshot) => {
        if (snapshot.key === playerId) return;
        const player = players[snapshot.key!];
        if (player) {
            scene.remove(player);
            delete players[snapshot.key!];
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
            quaternion: playerAirplane.quaternion.toArray(),
            health: health ?? 100,
            lastSeen: Date.now(),
        });
    }
}

export function fireBullet(position: Vector3, quaternion: Quaternion) {
    push(bulletsRef, {
        playerId,
        position: position.toArray(),
        quaternion: quaternion.toArray(),
        timestamp: Date.now(),
    });
}

export function onBulletFired(callback: (data: any) => void) {
    onChildAdded(bulletsRef, (snapshot) => {
        const data = snapshot.val();
        if (!data || data.playerId === playerId) return;
        // Only process bullets fired after we joined
        if (data.timestamp && data.timestamp >= joinTimestamp) {
            callback(data);
        }
    });
}

export function reportHit(victimId: string, attackerId: string) {
    push(hitsRef, { victimId, attackerId, damage: 20, timestamp: Date.now() });
}

export function onPlayerHit(callback: (victimId: string, attackerId: string, damage: number) => void) {
    onChildAdded(hitsRef, (snapshot) => {
        const data = snapshot.val();
        if (!data || !data.victimId || !data.attackerId) return;
        // Only process hits that happened after we joined
        if (data.timestamp && data.timestamp >= joinTimestamp) {
            callback(data.victimId, data.attackerId, data.damage || 20);
        }
    });
}

export function reportKill(killerId: string) {
    push(killsRef, { killerId, timestamp: Date.now() });
}

export function onKillReported(callback: (killerId: string) => void) {
    onChildAdded(killsRef, (snapshot) => {
        const data = snapshot.val();
        if (!data || !data.killerId) return;
        // Only process kills that happened after we joined
        if (data.timestamp && data.timestamp >= joinTimestamp) {
            callback(data.killerId);
        }
    });
}
