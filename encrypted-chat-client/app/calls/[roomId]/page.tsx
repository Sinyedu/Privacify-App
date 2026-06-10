import { Suspense } from "react";
import CallClient from "./CallClient";

type PageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { roomId } = await params;

  return (
    <Suspense fallback={<div>Loading call...</div>}>
      <CallClient roomId={roomId} />
    </Suspense>
  );
}
