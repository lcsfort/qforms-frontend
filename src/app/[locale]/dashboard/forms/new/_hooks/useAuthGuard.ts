import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAppSelector } from "@/lib/redux/hooks";

export function useAuthGuard(): void {
  const router = useRouter();
  const { token, hydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.push("/signin");
    }
  }, [hydrated, token, router]);
}
