import { TableToken } from '../types';
import { BaseTableFigureTokenNode } from '../base/BaseTableFigureTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';

export class TableTokenNode extends BaseTableFigureTokenNode {
  constructor(
    token: TableToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): TableToken {
    return this._token as TableToken;
  }

  protected getLabelPrefix(): string {
    return 'tab';
  }

  getEnvironmentName(): string {
    return 'Table';
  }
}
