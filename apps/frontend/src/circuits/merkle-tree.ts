export class MerkleTree {
  private levels: number;
  private zeroValues: bigint[];
  private leaves: Map<number, bigint>;

  constructor(levels: number) {
    this.levels = levels;
    this.leaves = new Map();
    this.zeroValues = this.generateZeroValues();
  }

  private generateZeroValues(): bigint[] {
    const zeros: bigint[] = [BigInt(0)];

    for (let i = 1; i <= this.levels; i++) {
      zeros.push(BigInt(0));
    }

    return zeros;
  }

  insert(leaf: bigint): number {
    const index = this.leaves.size;
    this.leaves.set(index, leaf);
    return index;
  }

  getRoot(): bigint {
    return this.computeRoot();
  }

  private computeRoot(): bigint {
    const nodes: Map<string, bigint> = new Map();

    this.leaves.forEach((leaf, index) => {
      nodes.set(`0-${index}`, leaf);
    });

    for (let level = 0; level < this.levels; level++) {
      const nextLevel = level + 1;
      const nodesAtLevel = Math.ceil(Math.pow(2, this.levels - level));

      for (let index = 0; index < nodesAtLevel; index += 2) {
        const leftKey = `${level}-${index}`;
        const rightKey = `${level}-${index + 1}`;

        const left = nodes.get(leftKey) ?? this.zeroValues[level];
        const right = nodes.get(rightKey) ?? this.zeroValues[level];

        const parent = left + right;
        nodes.set(`${nextLevel}-${Math.floor(index / 2)}`, parent);
      }
    }

    return nodes.get(`${this.levels}-0`) ?? this.zeroValues[this.levels];
  }

  getProof(leafIndex: number): { pathIndices: number[]; siblings: bigint[] } {
    const pathIndices: number[] = [];
    const siblings: bigint[] = [];

    if (!this.leaves.has(leafIndex)) {
      throw new Error("Leaf not found");
    }

    const nodes: Map<string, bigint> = new Map();
    this.leaves.forEach((leaf, index) => {
      nodes.set(`0-${index}`, leaf);
    });

    for (let level = 0; level < this.levels; level++) {
      const nextLevel = level + 1;
      const nodesAtLevel = Math.ceil(Math.pow(2, this.levels - level));

      for (let index = 0; index < nodesAtLevel; index += 2) {
        const leftKey = `${level}-${index}`;
        const rightKey = `${level}-${index + 1}`;

        const left = nodes.get(leftKey) ?? this.zeroValues[level];
        const right = nodes.get(rightKey) ?? this.zeroValues[level];

        const parent = left + right;
        nodes.set(`${nextLevel}-${Math.floor(index / 2)}`, parent);
      }
    }

    let currentIndex = leafIndex;

    for (let level = 0; level < this.levels; level++) {
      const isRight = currentIndex % 2;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;

      pathIndices.push(isRight);

      const siblingKey = `${level}-${siblingIndex}`;
      const sibling = nodes.get(siblingKey) ?? this.zeroValues[level];
      siblings.push(sibling);

      currentIndex = Math.floor(currentIndex / 2);
    }

    return { pathIndices, siblings };
  }
}
