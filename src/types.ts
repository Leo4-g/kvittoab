import { PlusCircle, Receipt as ReceiptIcon } from 'lucide-react';

export type Receipt = {
  id: string;
  amount: number;
  vendor: string;
  tax_category: string; // or 'category' if that's what your DB uses
  date: string;
  // ...add any other fields you use
};