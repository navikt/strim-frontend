import {useRef, useState} from "react";
import {BodyShort, Button, HStack, Popover, Tag, VStack} from "@navikt/ds-react";

function CategoryTags({
                          categories,
                          maxVisible = 3,
                      }: {
    categories?: { id: number; name: string }[];
    maxVisible?: number;
}) {
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);

    if (!categories || categories.length === 0) return null;

    const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name, "nb-NO"));
    const visible = sorted.slice(0, maxVisible);
    const hidden = sorted.slice(maxVisible);

    return (
        <>
            {visible.map((c) => (
                <Tag key={c.id} size="small" variant="alt1">
                    {c.name}
                </Tag>
            ))}

            {hidden.length > 0 && (
                <>
                    <Button
                        type="button"
                        variant="tertiary-neutral"
                        size="xsmall"
                        ref={buttonRef}
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen((v) => !v);
                        }}
                    >
                        +{hidden.length}
                    </Button>

                    <Popover
                        anchorEl={buttonRef.current}
                        open={open}
                        onClose={() => setOpen(false)}
                        placement="top"
                    >
                        <Popover.Content onClick={(e) => e.stopPropagation()} className="max-w-xs">
                            <VStack gap="2">
                                <BodyShort weight="semibold">Flere tags</BodyShort>
                                <HStack gap="2" wrap>
                                    {hidden.map((c) => (
                                        <Tag key={c.id} size="small" variant="alt1">
                                            {c.name}
                                        </Tag>
                                    ))}
                                </HStack>
                            </VStack>
                        </Popover.Content>
                    </Popover>
                </>
            )}
        </>
    );
}

export default CategoryTags;