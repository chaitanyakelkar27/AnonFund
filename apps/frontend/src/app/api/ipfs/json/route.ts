import { NextResponse } from "next/server";

const PINATA_JWT = process.env.PINATA_JWT;

export async function POST(request: Request): Promise<Response> {
    try {
        if (!PINATA_JWT) {
            return NextResponse.json({ error: "PINATA_JWT is not configured." }, { status: 500 });
        }

        const payload = await request.json();
        const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${PINATA_JWT}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: "Failed to upload to IPFS", details: errorText }, { status: 500 });
        }

        const result = await response.json();
        return NextResponse.json({ cid: result.IpfsHash });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        return NextResponse.json({ error: "Failed to upload to IPFS", details: message }, { status: 500 });
    }
}
