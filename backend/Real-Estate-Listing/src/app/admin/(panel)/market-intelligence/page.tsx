import type { Metadata } from "next";

import { MarketIntelligenceView } from "@/components/market/market-view";

export const metadata: Metadata = {
  title: "Market intelligence",
};

export default function MarketIntelligencePage() {
  return <MarketIntelligenceView />;
}
