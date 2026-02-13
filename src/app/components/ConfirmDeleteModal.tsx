"use client";

import React from "react";
import {BodyLong, Button, Modal} from "@navikt/ds-react";

type ConfirmDeleteModalProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;

    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;

    loading?: boolean;
    errorMessage?: string | null;
};

export function ConfirmDeleteModal({
                                       open,
                                       onClose,
                                       onConfirm,
                                       title = "Slette møtet?",
                                       description = "Dette kan ikke angres. Møtet blir slettet permanent.",
                                       confirmText = "Ja, slett",
                                       cancelText = "Avbryt",
                                       loading = false,
                                       errorMessage = null,
                                   }: ConfirmDeleteModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            header={{heading: title}}
            width="small"
        >
            <Modal.Body>
                <BodyLong spacing>{description}</BodyLong>

                {errorMessage ? (
                    <BodyLong role="alert">
                        {errorMessage}
                    </BodyLong>
                ) : null}
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="danger"
                    loading={loading}
                    onClick={() => onConfirm()}
                >
                    {confirmText}
                </Button>
                <Button variant="secondary" onClick={onClose} disabled={loading}>
                    {cancelText}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
