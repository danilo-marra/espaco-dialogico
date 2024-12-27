import { useEffect } from "react";
import { useRouter } from "next/router";

const DashboardIndex = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/Home/");
  }, [router]);

  return null;
};

export default DashboardIndex;
