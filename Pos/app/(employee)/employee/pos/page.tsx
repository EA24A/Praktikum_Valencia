import { Suspense } from "react";
import { PosShell } from "@/components/pos/pos-shell";

export default function EmployeePosPage() {
  return (
    <Suspense fallback={null}>
      <PosShell />
    </Suspense>
  );
}
