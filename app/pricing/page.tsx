"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SubscriptionModal from "@/components/SubscriptionModal";

function PricingContent() {
  const searchParams = useSearchParams();

  const isNewUser = searchParams?.get("new") === "true";
  const preselect = searchParams?.get("preselect") || "basic";

  return (
    <SubscriptionModal
      isFullPage={true}
      isNewUser={isNewUser}
      preselectedTier={preselect}
    />
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <PricingContent />
    </Suspense>
  );
}
