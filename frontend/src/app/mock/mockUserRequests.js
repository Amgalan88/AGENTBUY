// src/mock/userRequests.js
export const mockUserRequests = [
    {
        id: "REQ-001",
        type: "single",
        app: "taobao",
        name: "Nike Air Force 1",
        mark: "DD1391-100",
        status: "new", // new | in-review | offered | closed
    },
    {
        id: "REQ-002",
        type: "batch",
        app: "any",
        name: "Kids winter clothes (3 items)",
        mark: "",
        status: "in-review",
    },
    {
        id: "REQ-003",
        type: "single",
        app: "1688",
        name: "Bluetooth speaker",
        mark: "Model X12",
        status: "offered",
    },
    {
        id: "REQ-004",
        type: "single",
        app: "pinduoduo",
        name: "Kitchen tools set",
        mark: "",
        status: "closed",
    },
];
