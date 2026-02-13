import { Button } from "@navikt/ds-react";
import Link from "next/link";
import { ArrowLeftIcon } from "@navikt/aksel-icons";

export default function TilbakeKnapp() {
    return (
        <div className="mb-4">
            <Button
                as={Link}
                href="/"
                variant="secondary"
                icon={<ArrowLeftIcon aria-hidden />}
            >
                Tilbake
            </Button>
        </div>
    );
}
