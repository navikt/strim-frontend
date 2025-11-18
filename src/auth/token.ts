import { requestOboToken, validateToken, getToken } from "@navikt/oasis";
import type { User } from "@/types/user";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function checkToken(redirectTo?: string) {
    if (process.env.NODE_ENV === "development") return;

    const headerList = await headers();              // ⬅️ await here
    const token = getToken(headerList);              // ⬅️ pass Headers, not Promise

    if (!token) {
        if (redirectTo) {
            redirect(`/oauth2/login?redirect=${redirectTo}`);
        }
        redirect("/oauth2/login");
    }

    const result = await validateToken(token);
    if (!result.ok) {
        console.log("Tokenvalidering gikk galt");
        redirectTo
            ? redirect(`/oauth2/login?redirect=${redirectTo}`)
            : redirect("/oauth2/login");
    }
}

// fjernet : ${result.error.message}

export async function getUser(): Promise<User> {     // ⬅️ now async
    if (process.env.NODE_ENV === "development") {
        return {
            firstName: "Ola Kari",
            lastName: "Nordmann",
            email: "dev@localhost",
        };
    }

    const headerList = await headers();              // ⬅️ await here
    const authHeader = headerList.get("Authorization");

    if (!authHeader) {
        redirect("/oauth2/login");
    }

    const token = authHeader.replace("Bearer ", "");
    const jwtPayload = token.split(".")[1];
    const payload = JSON.parse(Buffer.from(jwtPayload, "base64").toString());

    const [lastName, firstName] = payload.name.split(", ");
    const email = payload.preferred_username.toLowerCase();

    return {
        firstName,
        lastName,
        email,
    };
}

export async function getAccessToken(
    scope: string = "",
): Promise<string | null> {
    if (process.env.NODE_ENV === "development") return null;

    const headerList = await headers();              // ⬅️ await here
    const token = getToken(headerList);

    if (!token) {
        throw new Error("No access token, please log in...");
    }

    const result = await requestOboToken(token, scope);

    if (!result.ok) {
        console.log("Grant azure obo token failed");
        return null;
    }
    // fjernet : ${result.error.message}

    return result.token;
}

export async function getDeltaBackendAccessToken(): Promise<string | null> {
    const scope =
        process.env.NEXT_PUBLIC_CLUSTER === "prod"
            ? "api://prod-gcp.delta.delta-backend/.default"
            : "api://dev-gcp.delta.delta-backend/.default";

    return getAccessToken(scope);
}
