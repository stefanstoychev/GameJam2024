import { Hex } from "./lib";

  export class HexNode {
    public hex: Hex;
    public f: number;
    public g: number;
    public h: number;
    public parent: HexNode | null;
  
    constructor(hex: Hex) {
      this.hex = hex;
      this.f = 0;
      this.g = 0;
      this.h = 0;
      this.parent = null;
    }
  }
  
  export class AStarHex {
    public openList: HexNode[];
    public closedList: HexNode[];
    public startNode: HexNode;
    public endNode: HexNode;
    public invalidTiles: Set<string>;
  
    constructor(invalidTiles: Hex[]) {
      this.openList = [];
      this.closedList = [];
      this.startNode = new HexNode(new Hex(0, 0, 0));
      this.endNode = new HexNode(new Hex(0, 0, 0));
      this.invalidTiles = new Set(invalidTiles.map(tile => `${tile.q},${tile.r},${tile.s}`));
    }
  
    public findPath(start: Hex, end: Hex): HexNode[] | null {

      if(this.invalidTiles.has(this.endNode.hex.toStringsCoords()))
        return [];

      this.startNode = new HexNode(start);
      this.endNode = new HexNode(end);
  
      this.openList = [];
      this.closedList = [];
  
      this.openList.push(this.startNode);
  
      while (this.openList.length > 0) {
        const currentNode = this.getMinCostNode();
        if (currentNode.hex.q === this.endNode.hex.q && currentNode.hex.r === this.endNode.hex.r && currentNode.hex.s === this.endNode.hex.s) {
          return this.getPath(currentNode);
        }
  
        this.removeNodeFromOpenList(currentNode);
        this.closedList.push(currentNode);
  
        const neighbors = this.getNeighbors(currentNode);
  
        for (const neighbor of neighbors) {
          if (this.closedList.find((node) => node.hex.q === neighbor.hex.q && node.hex.r === neighbor.hex.r && node.hex.s === neighbor.hex.s)) {
            continue;
          }
  
          const gScore = currentNode.g + 1;
          const inOpenList = this.openList.find((node) => node.hex.q === neighbor.hex.q && node.hex.r === neighbor.hex.r && node.hex.s === neighbor.hex.s);
  
          if (!inOpenList || gScore < neighbor.g) {
            neighbor.g = gScore;
            neighbor.h = this.calculateHeuristic(neighbor);
            neighbor.f = neighbor.g + neighbor.h;
            neighbor.parent = currentNode;
  
            if (!inOpenList) {
              this.openList.push(neighbor);
            }
          }
        }
      }
  
      return null;
    }
  
    public getMinCostNode(): HexNode {
      let minCostNode = this.openList[0];
      for (const node of this.openList) {
        if (node.f < minCostNode.f) {
          minCostNode = node;
        }
      }
      return minCostNode;
    }
  
    public removeNodeFromOpenList(node: HexNode): void {
      this.openList = this.openList.filter((n) => n !== node);
    }
  
    public getNeighbors(node: HexNode): HexNode[] {
      const neighbors: HexNode[] = [];
      const directions = [
        [1, 0, -1], [1, -1, 0], [0, -1, 1],
        [-1, 0, 1], [-1, 1, 0], [0, 1, -1],
      ];
  
      for (const dir of directions) {
        const newHex = new Hex(node.hex.q + dir[0], node.hex.r + dir[1], node.hex.s + dir[2]);
        const key = `${newHex.q},${newHex.r},${newHex.s}`;
  
        if (this.isValidPosition(newHex) && !this.invalidTiles.has(key)) {
          neighbors.push(new HexNode(newHex));
        }
      }
  
      return neighbors;
    }
  
    public isValidPosition(hex: Hex): boolean {
      return !this.invalidTiles.has(hex.toStringsCoords());
    }
  
    public calculateHeuristic(node: HexNode): number {
      // Using Euclidean distance as the heuristic
      return Math.sqrt(Math.pow(node.hex.q - this.endNode.hex.q, 2) + Math.pow(node.hex.r - this.endNode.hex.r, 2) + Math.pow(node.hex.s - this.endNode.hex.s, 2));
    }
  
    public getPath(endNode: HexNode): HexNode[] {
      const path: HexNode[] = [];
      let currentNode: HexNode | null = endNode;
  
      while (currentNode !== null) {
        path.unshift(currentNode);
        currentNode = currentNode.parent;
      }
  
      return path;
    }
  }
  