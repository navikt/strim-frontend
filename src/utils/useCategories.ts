import { useState, useEffect } from "react";
import type { CategoryDTO } from "@/types/category";

export function useCategories() {
    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch("/api/category", { cache: "no-store" });
                if (!res.ok) {
                    if (alive) {
                        console.error(`Failed to fetch categories (${res.status})`);
                        setCategories([]);
                        setError("Klarte ikke å hente tags.");
                    }
                }

                const data = (await res.json()) as CategoryDTO[];
                if (alive) setCategories(data);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; };
    }, []);

    return { categories, loading, error };
}
