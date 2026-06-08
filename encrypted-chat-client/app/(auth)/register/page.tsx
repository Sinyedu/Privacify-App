import { Suspense } from "react";
import RegisterPage from "@/app/components/register/RegisterPage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading register...</div>}>
      <RegisterPage />
    </Suspense>
  );
}
