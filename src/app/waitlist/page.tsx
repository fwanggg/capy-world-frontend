import { Suspense } from "react";
import WaitlistClient from "./WaitlistClient";

export const dynamic = "force-dynamic";

export default function Waitlist() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--color-gray-50)",
          }}
        >
          <p style={{ color: "var(--color-gray-500)" }}>Loading...</p>
        </div>
      }
    >
      <WaitlistClient />
    </Suspense>
  );
}
