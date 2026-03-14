export const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT!;
export const PINATA_GATEWAY =
    process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";

export async function uploadToIPFS(data: object): Promise<string> {
    try {
        const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${PINATA_JWT}`,
            },
            body: JSON.stringify({
                pinataContent: data,
                pinataMetadata: {
                    name: `anonfund-project-${Date.now()}`,
                },
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to upload to IPFS");
        }

        const result = await response.json();
        return result.IpfsHash;
    } catch (error) {
        console.error("IPFS upload error:", error);
        throw error;
    }
}

export async function fetchFromIPFS<T>(cid: string): Promise<T> {
    try {
        const url = `${PINATA_GATEWAY}${cid}`;
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

        const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PINATA_JWT}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Failed to upload image");
        }

        const result = await response.json();
        const imageUrl = `${PINATA_GATEWAY}${result.IpfsHash}`;
        console.log("Image uploaded to IPFS:", imageUrl);
        return imageUrl;
    } catch (error) {
        console.error("Image upload error:", error);
        throw error;
    }
}