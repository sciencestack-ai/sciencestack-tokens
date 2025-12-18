import { BaseToken, TokenType } from "./types";
import { AbstractTokenNode } from "./base/AbstractTokenNode";
import { TokenNodeFactory } from "./base/TokenNodeFactory";

export function processTokenNodes(
  tokens: BaseToken[] | undefined,
  excludedTokenTypes?: TokenType[]
): AbstractTokenNode[] {
  if (!tokens) return [];
  const nodes: AbstractTokenNode[] = [];
  const factory = new TokenNodeFactory();

  if (excludedTokenTypes) {
    factory.setExcludedTokenTypes(excludedTokenTypes);
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const node = factory.createNode(token);
    if (node) {
      nodes.push(node);
    }
  }
  return nodes;
}
