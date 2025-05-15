export interface User {
  id: string;
  email: string;
  created_at?: string;
  [key: string]: any;
}

export interface Receipt {
  id: string;
  user_id: string;
  merchant: string;
  date: string;
  total: number;
  items?: ReceiptItem[];
  image_url?: string;
  category?: string;
  notes?: string;
  created_at: string;
  type: 'income' | 'expense';
}

export interface ReceiptItem {
  id: string;
  receipt_id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  user_id?: string;
}
