"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {PlusIcon} from "@navikt/aksel-icons";

export default function Header() {
    const [, setIsMobile] = useState(true);
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const linkButton =
        "flex text-white no-underline items-center text-text-subtle bg-transparent hover:underline hover:bg-transparent navds-button navds-button--medium";
    return (
        <div style={{background: "rgba(19,17,54)"}}>
            <header className="flex py-2 z-10 items-center w-5/6 max-w-[80rem] m-auto justify-between">
                <div className="flex items-stretch">
                    <Link data-umami-event="Delta-logo besøkt" className={linkButton} href="/">
                        <span className="text-2xl whitespace-nowrap text-white">Strim</span>
                    </Link>
                </div>
                <div>
                    <Link className={linkButton} prefetch={false} data-umami-event="Opprett event besøkt"
                          data-umami-event-placement="Header" href="/newEvent/createEvent">
                        <PlusIcon aria-hidden fontSize="1.5rem"/>
                            <span className="whitespace-nowrap">
                                Opprett arrangement
                            </span>
                    </Link>
                </div>
            </header>
        </div>
    );
}
