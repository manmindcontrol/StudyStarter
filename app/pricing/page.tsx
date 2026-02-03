"use client";

import { useSearchParams } from "next/navigation";
import SubscriptionModal from "@/components/SubscriptionModal";

export default function PricingPage() {
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
