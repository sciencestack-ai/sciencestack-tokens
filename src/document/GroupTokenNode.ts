import { GroupToken } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';

export class GroupTokenNode extends BaseTokenNode {
  constructor(
    token: GroupToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  getReferenceText(): string | null {
    const firstChild = this.getFirstChild();
    if (firstChild) {
      return firstChild.getReferenceText();
    }
    return null;
  }
}
