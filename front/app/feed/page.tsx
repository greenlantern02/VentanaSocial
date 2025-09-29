"use client";

import { Suspense } from "react";
import FeedContent from "./feed";

export default function Home() {
  return (
    <Suspense fallback={<div>Loading feed...</div>}>
      <FeedContent />
    </Suspense>
  );
}
