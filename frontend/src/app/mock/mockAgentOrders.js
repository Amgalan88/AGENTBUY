// src/mock/agentOrders.js

// Agent-д харагдах идэвхтэй user хүсэлтүүд
export const mockAgentOrders = [
  {
    id: "REQ-001",
    type: "single",
    app: "taobao",
    name: "Nike Air Force 1",
    mark: "DD1391-100",
    quantity: 1,
    urgency: "urgent", // urgent | normal | low
    liked: true,
    isToday: true,
  },
  {
    id: "REQ-002",
    type: "single",
    app: "pinduoduo",
    name: "Kids winter jacket",
    mark: "",
    quantity: 2,
    urgency: "normal",
    liked: false,
    isToday: true,
  },
  {
    id: "REQ-003",
    type: "batch",
    app: "1688",
    name: "Ноосон цамц (10ш багц)",
    mark: "",
    quantity: 10,
    urgency: "low",
    liked: false,
    isToday: false,
  },
  {
    id: "REQ-004",
    type: "single",
    app: "dewu",
    name: "Air Jordan 1 Low",
    mark: "553558-136",
    quantity: 1,
    urgency: "urgent",
    liked: true,
    isToday: false,
  },
];

// Agent-ийн өөрийн history (илгээсэн санал, явж байгаа, амжилттай, амжилтгүй…)
export const mockAgentHistory = [
  {
    id: "HIST-001",
    requestId: "REQ-001",
    app: "taobao",
    name: "Nike Air Force 1",
    status: "offered", // offered | in-progress | success | failed
    updatedAt: "2025-11-20",
  },
  {
    id: "HIST-002",
    requestId: "REQ-010",
    app: "1688",
    name: "Bluetooth speaker (20ш)",
    status: "in-progress",
    updatedAt: "2025-11-21",
  },
  {
    id: "HIST-003",
    requestId: "REQ-007",
    app: "pinduoduo",
    name: "Kitchen tools set",
    status: "success",
    updatedAt: "2025-11-18",
  },
  {
    id: "HIST-004",
    requestId: "REQ-005",
    app: "dewu",
    name: "Yeezy 350 V2",
    status: "failed",
    updatedAt: "2025-11-17",
  },
];
