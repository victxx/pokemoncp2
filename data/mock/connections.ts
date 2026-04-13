import type { Connection } from "@/lib/types/domain";

export const MOCK_CONNECTIONS: Connection[] = [
  {
    id: "c1",
    userAId: "u1",
    userBId: "u2",
    connectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "valid"
  },
  {
    id: "c2",
    userAId: "u1",
    userBId: "u3",
    connectedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    status: "valid"
  }
];
