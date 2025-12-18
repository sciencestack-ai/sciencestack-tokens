import { SubFigureToken } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { extractLabelsFromChilds, convertTokens2String } from '../utils';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { BaseTableFigureTokenNode } from '../base/BaseTableFigureTokenNode';

export class SubFigureTokenNode extends BaseTableFigureTokenNode {
  constructor(
    token: SubFigureToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): SubFigureToken {
    return this._token as SubFigureToken;
  }

  protected getLabelPrefix(): string {
    return 'subfig';
  }

  getEnvironmentName(): string {
    return 'Figure';
  }
}
