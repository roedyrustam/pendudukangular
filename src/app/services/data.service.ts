import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  docData,
  getDocs
} from '@angular/fire/firestore';
import { Family, Resident, ServiceRequest, ResidentDocument } from '../models/data.models';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);

  // --- FAMILIES ---
  getFamilies(): Observable<Family[]> {
    return collectionData(
      query(collection(this.firestore, 'families'), orderBy('created_at', 'desc')),
      { idField: 'id' }
    ) as Observable<Family[]>;
  }

  async addFamily(family: Family) {
    const ref = doc(this.firestore, 'families', family.kk_number);
    return setDoc(ref, { ...family, created_at: new Date() });
  }

  async updateFamily(family: Family) {
    const ref = doc(this.firestore, 'families', family.kk_number);
    return updateDoc(ref, { ...family });
  }

  async deleteFamily(kk_number: string) {
    const ref = doc(this.firestore, 'families', kk_number);
    return deleteDoc(ref);
  }

  // --- RESIDENTS ---
  getResidents(familyId?: string): Observable<Resident[]> {
    let colRef = collection(this.firestore, 'residents');
    let q;
    if (familyId) {
      q = query(colRef, where('family_id', '==', familyId), orderBy('created_at', 'desc'));
    } else {
      q = query(colRef, orderBy('created_at', 'desc'));
    }
    return collectionData(q, { idField: 'id' }) as Observable<Resident[]>;
  }

  async addResident(resident: Resident) {
    const ref = doc(this.firestore, 'residents', resident.nik);
    return setDoc(ref, { ...resident, created_at: new Date() });
  }

  async updateResident(resident: Resident) {
    const ref = doc(this.firestore, 'residents', resident.nik);
    return updateDoc(ref, { ...resident });
  }

  async deleteResident(nik: string) {
    const ref = doc(this.firestore, 'residents', nik);
    return deleteDoc(ref);
  }

  // --- SERVICE REQUESTS ---
  getRequests(): Observable<ServiceRequest[]> {
    return collectionData(
      query(collection(this.firestore, 'requests'), orderBy('created_at', 'desc')),
      { idField: 'id' }
    ) as Observable<ServiceRequest[]>;
  }

  async addRequest(request: ServiceRequest) {
    const colRef = collection(this.firestore, 'requests');
    return addDoc(colRef, { ...request, created_at: new Date() });
  }

  async updateRequestStatus(requestId: string, status: string) {
    const ref = doc(this.firestore, 'requests', requestId);
    return updateDoc(ref, { status });
  }

  // --- DETAIL FETCHERS ---
  getResident(nik: string): Observable<Resident | undefined> {
    const ref = doc(this.firestore, 'residents', nik);
    return docData(ref, { idField: 'id' }) as Observable<Resident | undefined>;
  }

  getFamily(kk_number: string): Observable<Family | undefined> {
    const ref = doc(this.firestore, 'families', kk_number);
    return docData(ref, { idField: 'id' }) as Observable<Family | undefined>;
  }

  getResidentRequests(nik: string): Observable<ServiceRequest[]> {
    const colRef = collection(this.firestore, 'requests');
    const q = query(colRef, where('nik', '==', nik), orderBy('created_at', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<ServiceRequest[]>;
  }

  // --- DOCUMENTS ---
  getResidentDocuments(nik: string): Observable<ResidentDocument[]> {
    const colRef = collection(this.firestore, 'residents_docs');
    const q = query(colRef, where('nik', '==', nik), orderBy('created_at', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<ResidentDocument[]>;
  }

  async uploadResidentDocument(nik: string, file: File, type: string) {
    const filePath = `residents/${nik}/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, filePath);
    
    // Upload file
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);

    // Save metadata
    const docData: ResidentDocument = {
      nik,
      name: file.name,
      url: downloadUrl,
      path: filePath,
      type,
      created_at: new Date()
    };
    
    return addDoc(collection(this.firestore, 'residents_docs'), docData);
  }

  async deleteResidentDocument(docId: string, path: string) {
    // Delete file from storage
    const storageRef = ref(this.storage, path);
    await deleteObject(storageRef);

    // Delete metadata from firestore
    const docRef = doc(this.firestore, 'residents_docs', docId);
    return deleteDoc(docRef);
  }

  async updateRequestStatus(requestId: string, status: string, adminNote: string) {
    const docRef = doc(this.firestore, 'services', requestId);
    return updateDoc(docRef, {
      status,
      admin_note: adminNote,
      updated_at: new Date()
    });
  }

  // --- USER MANAGEMENT ---
  getUsers(): Observable<AppUser[]> {
    return collectionData(
      query(collection(this.firestore, 'users'), orderBy('created_at', 'desc')),
      { idField: 'id' }
    ) as Observable<AppUser[]>;
  }

  async updateUserRole(uid: string, role: UserRole) {
    const docRef = doc(this.firestore, 'users', uid);
    return updateDoc(docRef, { role });
  }

  // --- Multi-Upload & Enhanced Services ---
  
  async uploadFileOnly(file: File, path: string): Promise<string> {
    const storageRef = ref(this.storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  async uploadMultipleFiles(files: FileList | File[], basePath: string): Promise<string[]> {
    const urls: string[] = [];
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const path = `${basePath}/${Date.now()}_${file.name}`;
      const url = await this.uploadFileOnly(file, path);
      urls.push(url);
    }
    return urls;
  }

  async getResidentByNikSync(nik: string): Promise<Resident | null> {
    const q = query(collection(this.firestore, 'residents'), where('nik', '==', nik));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Resident;
  }

  async updateRequestFull(requestId: string, data: Partial<ServiceRequest>) {
    const docRef = doc(this.firestore, 'requests', requestId);
    return updateDoc(docRef, { ...data, processed_at: new Date() });
  }
  async getRequestById(requestId: string): Promise<ServiceRequest | null> {
    const docRef = doc(this.firestore, 'requests', requestId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as ServiceRequest;
  }
}
