import { useEffect } from "react";
import { useRouter } from "next/router";

const DashboardIndex = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/Dashboard/Home/");
  }, [router]);

  return null;
};

export default DashboardIndex;
