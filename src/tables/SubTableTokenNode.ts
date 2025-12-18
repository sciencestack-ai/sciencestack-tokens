import { SubTableToken } from '../types';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { BaseTableFigureTokenNode } from '../base/BaseTableFigureTokenNode';

export class SubTableTokenNode extends BaseTableFigureTokenNode {
  constructor(
    token: SubTableToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): SubTableToken {
    return this._token as SubTableToken;
  }

  protected getLabelPrefix(): string {
    return 'subtab';
  }

  getEnvironmentName(): string {
    return 'Table';
  }
}
