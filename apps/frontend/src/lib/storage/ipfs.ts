const DEFAULT_GATEWAY = "https://gateway.pinata.cloud/ipfs/";
export const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || DEFAULT_GATEWAY;

function normalizeGateway(base: string): string {
    if (!base) {
        return DEFAULT_GATEWAY;
    }

    const trimmed = base.endsWith("/") ? base : `${base}/`;
    if (trimmed.includes("/ipfs/")) {
        return trimmed;
    }

    return `${trimmed}ipfs/`;
}

export async function uploadToIPFS(data: object): Promise<string> {
    try {
        const response = await fetch("/api/ipfs/json", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                pinataContent: data,
                pinataMetadata: {
                    name: `anonfund-project-${Date.now()}`,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            const message = errorText ? `Failed to upload to IPFS: ${errorText}` : "Failed to upload to IPFS";
            throw new Error(message);
        }

        const result = await response.json();
        return result.cid;
    } catch (error) {
        console.error("IPFS upload error:", error);
        throw error;
    }
}

export async function fetchFromIPFS<T>(cid: string): Promise<T> {
    try {
        const url = `${normalizeGateway(PINATA_GATEWAY)}${cid}`;
        console.log("Fetching from IPFS:", url);
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`IPFS fetch failed with status ${response.status}:`, response.statusText);
            throw new Error(`Failed to fetch from IPFS: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Successfully fetched IPFS data:", data);
        return data;
    } catch (error) {
        console.error("IPFS fetch error for CID:", cid, error);
        throw error;
    }
}

export async function uploadImageToIPFS(file: File): Promise<string> {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/ipfs/file", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            const message = errorText ? `Failed to upload image: ${errorText}` : "Failed to upload image";
            throw new Error(message);
        }

        const result = await response.json();
        const imageUrl = `${normalizeGateway(PINATA_GATEWAY)}${result.cid}`;
        console.log("Image uploaded to IPFS:", imageUrl);
        return imageUrl;
    } catch (error) {
        console.error("Image upload error:", error);
        throw error;
    }
}