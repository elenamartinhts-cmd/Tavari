import { differenceInDays } from "date-fns";
import type { Contract } from "@/lib/types";

// Auto-derives expiring/expired status from end_date — the DB status field
// only changes on an explicit write, so contracts can sit in a stale "active"
// row long after end_date has passed unless every read computes this.
export function computeContractStatus(contract: Pick<Contract, "status" | "end_date">): Contract["status"] {
  if (!contract.end_date) return contract.status;
  if (contract.status === "terminated" || contract.status === "draft") return contract.status;
  const daysLeft = differenceInDays(new Date(contract.end_date), new Date());
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 30) return "expiring";
  return contract.status;
}
