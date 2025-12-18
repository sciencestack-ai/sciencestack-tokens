import { FigureToken } from '../types';
import { BaseTableFigureTokenNode } from '../base/BaseTableFigureTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';

export class FigureTokenNode extends BaseTableFigureTokenNode {
  constructor(
    token: FigureToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): FigureToken {
    return this._token as FigureToken;
  }

  protected getLabelPrefix(): string {
    return 'fig';
  }

  getEnvironmentName(): string {
    return 'Figure';
  }
}
