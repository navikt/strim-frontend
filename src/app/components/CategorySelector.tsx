import { BodyLong, UNSAFE_Combobox } from "@navikt/ds-react";

interface CategorySelectorProps {
    categoryOptions: string[];
    selectedCategoryNames: string[];
    setSelectedCategoryNames: React.Dispatch<React.SetStateAction<string[]>>;
    loading: boolean;
    error: string | null;
    hasNewTags: boolean;
}

export default function CategorySelector({
                                             categoryOptions, selectedCategoryNames, setSelectedCategoryNames,
                                             loading, error, hasNewTags,
                                         }: CategorySelectorProps) {
    return (
        <div>
            <UNSAFE_Combobox
                label="Kategorier (valgfritt)"
                shouldAutocomplete
                allowNewValues
                isMultiSelect
                options={categoryOptions}
                selectedOptions={selectedCategoryNames}
                disabled={loading}
                onToggleSelected={(opt, sel) =>
                    setSelectedCategoryNames((p) => sel ? [...p, opt] : p.filter((c) => c !== opt))
                }
            />
            {hasNewTags && (
                <BodyLong size="small" className="text-text-subtle mt-1">
                    Nye tags opprettes først når arrangementet opprettes.
                </BodyLong>
            )}
            {error && <BodyLong className="text-red-600">{error}</BodyLong>}
        </div>
    );
}
