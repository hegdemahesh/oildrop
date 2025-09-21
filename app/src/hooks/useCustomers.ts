import { useEffect, useState } from 'react';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { initFirebase } from '../services/firebase';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  gstin?: string;
}

export function useCustomers() {
  initFirebase();
  const db = getFirestore();
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'customers'), (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  return { customers };
}
