"use client";

import { usePathname, useRouter } from "next/navigation";
import { Footer } from "@/components/layout/Footer";

export function CustomerFooter() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname.startsWith("/customer/bookings")) {
    return null;
  }

  return (
    <Footer
      onNavigate={(page) => {
        switch (page) {
          case "now-showing":
            router.push("/customer/movies");
            break;
          case "coming-soon":
            router.push("/customer/coming-soon");
            break;
          case "showtimes":
            router.push("/customer/showtimes");
            break;
          case "about":
            router.push("/customer/about");
            break;
          default:
            router.push("/");
            break;
        }
      }}
    />
  );
}
