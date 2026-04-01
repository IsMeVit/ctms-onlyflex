import { CustomerRouteHeader } from "@/components/layout/CustomerRouteHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import CarouselContent from "@/components/layout/CarouselContent";
import { NowShowing } from "@/components/layout/NowShowing";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <CustomerRouteHeader />
      <CarouselContent />
      <NowShowing />
      <ComingSoon />
      <CustomerFooter />
    </div>
  );
}
