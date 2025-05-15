export interface User {
  id: string;
  name: string;
  email: string;
  userType: string;
}

export interface Document {
  id: string;
  title: string;
  date: string;
  amount: number;
  category: string;
  imageUrl: string;
  userId: string;
}

export interface Report {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  categories: {
    name: string;
    amount: number;
  }[];
  userId: string;
}
