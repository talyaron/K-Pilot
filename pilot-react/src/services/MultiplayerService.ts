import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  onDisconnect,
  set,
  push,
  off,
  type DatabaseReference,
} from 'firebase/database';
import { Group, Quaternion, Scene, Vector3 } from 'three';
import { FIREBASE_CONFIG } from '../constants/firebaseConfig';
import { loadAirplane } from './PlaneLoaderService';
import type { IBulletData } from '../types';

export class MultiplayerService {
  private database;
  private playersRef: DatabaseReference;
  private bulletsRef: DatabaseReference;
  private hitsRef: DatabaseReference;
  private playerRef: DatabaseReference | null = null;
  private playerId: string = '';

  readonly otherPlayers: Record<string, Group> = {};

  constructor(private scene: Scene) {
    const app = initializeApp(FIREBASE_CONFIG);
    this.database = getDatabase(app);
    this.playersRef = ref(this.database, 'players');
    this.bulletsRef = ref(this.database, 'bullets');
    this.hitsRef = ref(this.database, 'hits');
  }

  getPlayerId(): string {
    return this.playerId;
  }

  init(playerAirplane: Group): void {
    this.playerId = Math.random().toString(36).substring(7);
    this.playerRef = ref(this.database, 'players/' + this.playerId);

    set(this.playerRef, {
      position: playerAirplane.position.toArray(),
      rotation: playerAirplane.rotation.toArray(),
    });

    onDisconnect(this.playerRef).remove();

    set(this.hitsRef, {});
    set(this.bulletsRef, {});

    onChildAdded(this.playersRef, async (snapshot) => {
      if (snapshot.key === this.playerId) return;
      const data = snapshot.val();
      const newPlayer = await loadAirplane();
      newPlayer.position.fromArray(data.position);
      newPlayer.rotation.fromArray(data.rotation);
      this.otherPlayers[snapshot.key!] = newPlayer;
      this.scene.add(newPlayer);
    });

    onChildChanged(this.playersRef, (snapshot) => {
      if (snapshot.key === this.playerId) return;
      const data = snapshot.val();
      const player = this.otherPlayers[snapshot.key!];
      if (player) {
        player.position.fromArray(data.position);
        player.rotation.fromArray(data.rotation);
      }
    });

    onChildRemoved(this.playersRef, (snapshot) => {
      if (snapshot.key === this.playerId) return;
      const player = this.otherPlayers[snapshot.key!];
      if (player) {
        this.scene.remove(player);
        delete this.otherPlayers[snapshot.key!];
      }
    });
  }

  updatePlayerPosition(airplane: Group): void {
    if (this.playerRef) {
      set(this.playerRef, {
        position: airplane.position.toArray(),
        rotation: airplane.rotation.toArray(),
      });
    }
  }

  fireBullet(position: Vector3, quaternion: Quaternion): void {
    push(this.bulletsRef, {
      playerId: this.playerId,
      position: position.toArray(),
      quaternion: quaternion.toArray(),
    });
  }

  onBulletFired(callback: (data: IBulletData) => void): void {
    onChildAdded(this.bulletsRef, (snapshot) => {
      const data = snapshot.val();
      if (data.playerId !== this.playerId) {
        callback(data);
      }
    });
  }

  reportHit(victimId: string): void {
    push(this.hitsRef, { victimId });
  }

  onPlayerHit(callback: (victimId: string) => void): void {
    onChildAdded(this.hitsRef, (snapshot) => {
      const data = snapshot.val();
      callback(data.victimId);
    });
  }

  destroy(): void {
    off(this.playersRef);
    off(this.bulletsRef);
    off(this.hitsRef);
    if (this.playerRef) {
      set(this.playerRef, null);
    }
  }
}
