
'use client';

import { useLocale } from "@/hooks/use-locale";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function LocaleRedirect() {
    const { lang } = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // A simple trick to force re-render on language change
        // to update the UI with new translations.
        router.replace(pathname);
    }, [lang, pathname, router])

    return null;
}
