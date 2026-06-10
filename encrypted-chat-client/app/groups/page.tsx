import { Suspense } from "react";
import GroupsClient from "./GroupsClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading groups...</div>}>
      <GroupsClient />
    </Suspense>
  );
}
