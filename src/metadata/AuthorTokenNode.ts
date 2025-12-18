import { AuthorToken, MetadataToken, TokenType } from '../types';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { MetadataTokenNode } from './MetadataTokenNode';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { CommandTokenNode } from '../technical/CommandTokenNode';
import { AbstractTokenNode } from '../base/AbstractTokenNode';

export class AuthorTokenNode extends MetadataTokenNode {
  constructor(
    token: MetadataToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): AuthorToken {
    return this._token as AuthorToken;
  }

  getTypeStr(): string {
    return 'Authors';
  }

  getAuthorsSplit(): AbstractTokenNode[][] {
    const authors: AbstractTokenNode[][] = [];
    const children = this.getChildren();

    let group: AbstractTokenNode[] = [];
    for (const child of children) {
      // authors often delimited by \and
      if (child instanceof CommandTokenNode && child.command.toLowerCase() == 'and') {
        // split - push current group and start new one
        if (group.length > 0) {
          authors.push(group);
          group = [];
        }
      } else {
        group.push(child);
      }
    }

    // Don't forget to push the last group
    if (group.length > 0) {
      authors.push(group);
    }
    return authors;
  }
}
