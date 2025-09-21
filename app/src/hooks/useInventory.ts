import { useEffect, useState } from 'react';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { initFirebase } from '../services/firebase';

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  type: 'engine_oil' | 'coolant';
  stock: number;
  price: number;
  gstPercent: number;
}

export function useInventory() {
  initFirebase();
  const db = getFirestore();
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const colRef = collection(db, 'inventory');
    const unsub = onSnapshot(colRef, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => unsub();
  }, []);

  const lowStock = items.filter(i => i.stock < 5);
  return { items, inventoryCount: items.length, lowStock };
}
