import * as admin from 'firebase-admin';
import { Request, Response } from 'express';

export async function gstSummary(req: Request, res: Response) {
  try {
    const db = admin.firestore();
    const month = req.query.month as string | undefined; // format YYYY-MM
    const invoicesSnap = await db.collection('invoices').get(); // TODO: filter by month server-side with timestamp field
    let totalTax = 0; let totalAmount = 0;
    invoicesSnap.forEach(doc => {
      const inv = doc.data() as any;
      totalAmount += inv.total || 0;
      totalTax += inv.tax || 0;
    });
    res.json({ month: month || 'ALL', totalAmount, totalTax });
  } catch (e:any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
