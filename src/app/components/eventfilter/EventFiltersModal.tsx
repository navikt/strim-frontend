import React, { useRef, useState } from "react";
import {
    Button,
    DatePicker,
    HGrid,
    HStack,
    Modal,
    Select,
    TextField,
    UNSAFE_Combobox,
    useDatepicker,
    VStack,
} from "@navikt/ds-react";
import { FunnelIcon } from "@navikt/aksel-icons";

export type SortOption = "date_asc" | "date_desc" | "title_asc" | "title_desc";

export type EventFilterValue = {
    q: string;
    fromDate: Date | null;
    toDate: Date | null;
    tags: string[];
    sort: SortOption | "";
};

type Option = { value: string; label: string };

type Props = {
    value: EventFilterValue;
    onChange: (next: EventFilterValue) => void;
    tagOptions: Option[];
    showDateRange?: boolean;
    showTags?: boolean;
    showSort?: boolean;
    labels?: Partial<{
        open: string;
        title: string;
        search: string;
        fromDate: string;
        toDate: string;
        tags: string;
        sort: string;
        reset: string;
        close: string;
        sortPlaceholder: string;
    }>;
};

const defaultLabels = {
    open: "Filtrer",
    title: "Filtrer møter",
    search: "Søk",
    fromDate: "Fra dato",
    toDate: "Til dato",
    tags: "Tags/kategorier",
    sort: "Sorter",
    reset: "Nullstill",
    close: "Lukk",
    sortPlaceholder: "Velg sortering",
};

function formatDateForInput(d: Date) {
    return d.toISOString().slice(0, 10);
}

function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

export function EventFiltersModal({
                                      value,
                                      onChange,
                                      tagOptions,
                                      showDateRange = true,
                                      showTags = true,
                                      showSort = true,
                                      labels,
                                  }: Props) {
    const L = { ...defaultLabels, ...labels };

    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDialogElement>(null);

    const fromPicker = useDatepicker({
        onDateChange: (date) => {
            const nextFrom = date ?? null;

            if (nextFrom && value.toDate && startOfDay(nextFrom) > startOfDay(value.toDate)) {
                onChange({ ...value, fromDate: nextFrom, toDate: nextFrom });
                return;
            }

            onChange({ ...value, fromDate: nextFrom });
        },
    });

    const toPicker = useDatepicker({
        onDateChange: (date) => {
            const nextTo = date ?? null;

            if (nextTo && value.fromDate && startOfDay(nextTo) < startOfDay(value.fromDate)) {
                onChange({ ...value, toDate: value.fromDate });
                return;
            }

            onChange({ ...value, toDate: nextTo });
        },
    });

    function reset() {
        onChange({
            q: "",
            fromDate: null,
            toDate: null,
            tags: [],
            sort: "",
        });
    }

    const tagOptionValues = tagOptions.map((t) => t.value);

    // Disable dates earlier than fromDate in the "to" picker
    const toMinDate = value.fromDate ? startOfDay(value.fromDate) : undefined;

    return (
        <>
            <Button variant="tertiary" size="small" onClick={() => setOpen(true)}>
                <span className="flex items-center gap-2">
                    <FunnelIcon aria-hidden fontSize="1.5rem" />
                    <span>{L.open}</span>
                </span>
            </Button>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                aria-labelledby="filter-modal-heading"
                ref={ref}
            >
                <Modal.Header>
                    <h2 id="filter-modal-heading" className="navds-heading navds-heading--medium">
                        {L.title}
                    </h2>
                </Modal.Header>

                <Modal.Body>
                    <VStack gap="5">
                        <TextField
                            label={L.search}
                            value={value.q}
                            onChange={(e) => onChange({ ...value, q: e.target.value })}
                            placeholder="Søk i tittel / beskrivelse"
                        />

                        <HGrid gap="4" columns={{ xs: 1, md: 2 }}>
                            {showDateRange && (
                                <DatePicker {...fromPicker.datepickerProps}>
                                    <DatePicker.Input
                                        {...fromPicker.inputProps}
                                        label={L.fromDate}
                                        value={value.fromDate ? formatDateForInput(value.fromDate) : undefined}
                                    />
                                </DatePicker>
                            )}

                            {showDateRange && (
                                <DatePicker {...toPicker.datepickerProps} fromDate={toMinDate}>
                                    <DatePicker.Input
                                        {...toPicker.inputProps}
                                        label={L.toDate}
                                        value={value.toDate ? formatDateForInput(value.toDate) : undefined}
                                    />
                                </DatePicker>
                            )}

                            {showSort && (
                                <Select
                                    label={L.sort}
                                    value={value.sort}
                                    onChange={(e) =>
                                        onChange({
                                            ...value,
                                            sort: e.target.value as SortOption | "",
                                        })
                                    }
                                >
                                    <option value="">{L.sortPlaceholder}</option>
                                    <option value="date_asc">Dato (stigende)</option>
                                    <option value="date_desc">Dato (synkende)</option>
                                    <option value="title_asc">Tittel (A–Å)</option>
                                    <option value="title_desc">Tittel (Å–A)</option>
                                </Select>
                            )}

                            {showTags && (
                                <UNSAFE_Combobox
                                    label={L.tags}
                                    isMultiSelect
                                    options={tagOptionValues}
                                    selectedOptions={value.tags}
                                    onToggleSelected={(option: string, isSelected: boolean) => {
                                        const next = isSelected
                                            ? [...value.tags, option]
                                            : value.tags.filter((t) => t !== option);

                                        onChange({ ...value, tags: Array.from(new Set(next)) });
                                    }}
                                />
                            )}
                        </HGrid>
                    </VStack>
                </Modal.Body>

                <Modal.Footer>
                    <HStack gap="2">
                        <Button variant="secondary" onClick={reset}>
                            {L.reset}
                        </Button>
                        <Button variant="primary" onClick={() => setOpen(false)}>
                            {L.close}
                        </Button>
                    </HStack>
                </Modal.Footer>
            </Modal>
        </>
    );
}