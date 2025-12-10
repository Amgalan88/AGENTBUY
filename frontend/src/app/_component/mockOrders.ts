// src/mock/orders.ts
export interface MockOrder {
  id: string;
  app: string;
  title: string;
  note: string;
  budget: string;
  urgency: "low" | "normal" | "urgent";
  images: string[];
}

export const mockOrders: MockOrder[] = [
  {
    id: "ORD-001",
    app: "Taobao",
    title: "Nike Air Max 2024",
    note: "42 размер, цагаан өнгө.",
    budget: "250000",
    urgency: "normal",
    images: ["/mock/shoes1.png"],
  },
  {
    id: "ORD-002",
    app: "Pinduoduo",
    title: "Kids winter jacket",
    note: "5 нас, хар өнгө.",
    budget: "70000",
    urgency: "urgent",
    images: [],
  },
  {
    id: "ORD-003",
    app: "1688",
    title: "Bluetooth speaker",
    note: "JBL-тэй төстэй загвар.",
    budget: "45000",
    urgency: "low",
    images: [],
  },
];

