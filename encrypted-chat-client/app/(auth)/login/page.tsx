import { Suspense } from "react";
import LoginPage from "@/app/components/login/LoginPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading login...</div>}>
      <LoginPage />
    </Suspense>
  );
}
