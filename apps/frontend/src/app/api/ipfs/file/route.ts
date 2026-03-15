import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PINATA_JWT = process.env.PINATA_JWT;

export async function POST(request: Request): Promise<Response> {
    try {
        if (!PINATA_JWT) {
            return NextResponse.json({ error: "PINATA_JWT is not configured." }, { status: 500 });
        }

        const incoming = await request.formData();
        const file = incoming.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "No file provided." }, { status: 400 });
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PINATA_JWT}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: "Failed to upload image", details: errorText }, { status: 500 });
        }

        const result = await response.json();
        return NextResponse.json({ cid: result.IpfsHash });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        return NextResponse.json({ error: "Failed to upload image", details: message }, { status: 500 });
    }
}
