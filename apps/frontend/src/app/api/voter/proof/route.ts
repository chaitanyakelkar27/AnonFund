import { NextRequest, NextResponse } from 'next/server';
import { getVoterRegistryService } from '@/lib/merkle/service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { nullifier } = body;

        if (!nullifier) {
            return NextResponse.json(
                { error: 'Nullifier is required' },
                { status: 400 }
            );
        }

        const service = getVoterRegistryService();
        
        // Build/update merkle tree from blockchain
        await service.buildMerkleTreeFromChain();

        // Get voter proof data
        const proofData = await service.getVoterProofData(BigInt(nullifier));

        if (!proofData) {
            return NextResponse.json(
                { error: 'Voter not found in registry' },
                { status: 404 }
            );
        }

        return NextResponse.json(proofData);
    } catch (error) {
        console.error('Error in voter proof API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
