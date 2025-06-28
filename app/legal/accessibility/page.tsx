import Link from "next/link";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: "Universell utforming Δ Strim",
};

export default async function Accessibility() {

    return (
            <div className="m-4 max-w-2xl font-serif">
                <h2 className="pb-4 text-2xl">Tilgjengelighetserklæring for Strim</h2>
                <p className="mb-4 leading-normal">NAVs påmeldingsløsning for interne arrangementer (Delta) skal være
                    tilgjengelig for alle. Det betyr at vi har som mål å følge lovpålagte krav til universell utforming.
                    Vår ambisjon er i tillegg at du skal ha en god brukeropplevelse enten du bruker hjelpeteknologi (for
                    eksempel skjermleser) eller ikke.</p>
                <p className="mb-4 leading-normal">Alle virksomheter i offentlig sektor skal ha en
                    tilgjengelighetserklæring. WCAG 2.1 på nivå AA er lovpålagt i Norge. Erklæringen beskriver hvert
                    suksesskriterium i WCAG, og om nettstedet imøtekommer disse kravene.</p>

                <h2 className="pb-4 pt-4 text-2xl">Feil, mangler og forbedringsforslag</h2>
                <p className="leading-normal">Hvis du opplever problemer eller har forslag til forbedringer hører vi
                    veldig gjerne fra deg! Feil og mangler kan rapporteres til <Link
                        href="mailto:eilif.johansen@nav.no"
                        className="text-deepblue-500 underline hover:no-underline">eilif.johansen@nav.no</Link>, eller <Link
                        href="https://nav-it.slack.com/archives/C05E0NJ6Z0C"
                        className="text-deepblue-500 underline hover:no-underline">#delta  på
                        Slack</Link>.</p>
            </div>
    );
}



