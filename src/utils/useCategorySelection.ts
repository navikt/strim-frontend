import { useState } from "react";
import type { CategoryDTO } from "@/types/category";

export function useCategorySelection(categories: CategoryDTO[]) {
    const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);

    const categoryOptions = categories.map((c) => c.name);

    const hasNewTags = selectedCategoryNames.some(
        (name) => !categories.some((c) => c.name.toLowerCase() === name.toLowerCase())
    );

    const resetSelection = () => setSelectedCategoryNames([]);

    return {
        selectedCategoryNames,
        setSelectedCategoryNames,
        categoryOptions,
        hasNewTags,
        resetSelection,
    };
}
