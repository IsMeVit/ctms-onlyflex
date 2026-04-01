"use client";

import { usePathname, useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/layout/CustomerHeader";

function getCurrentPage(pathname: string) {
  if (pathname.startsWith("/customer/movies/view") || pathname.startsWith("/customer/movies")) {
    return "now-showing";
  }

  if (pathname.startsWith("/customer/bookings") || pathname.startsWith("/customer/showtimes")) {
    return "showtimes";
  }

  if (pathname.startsWith("/customer/coming-soon")) {
    return "coming-soon";
  }

  if (pathname.startsWith("/customer/about")) {
    return "about";
  }

  return "home";
}

export function CustomerRouteHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (page: string) => {
    switch (page) {
      case "home":
        router.push("/");
        break;
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
  };

  return (
    <CustomerHeader
      currentPage={getCurrentPage(pathname)}
      onNavigate={handleNavigate}
      onAdminClick={() => router.push("/admin/login")}
    />
  );
}
