import { CommandToken } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { CopyContentOptions, LatexExportOptions } from '../export_types';

export class CommandTokenNode extends BaseTokenNode {
  constructor(
    token: CommandToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): CommandToken {
    return this._token as CommandToken;
  }

  get command(): string {
    return this.token.command;
  }

  getData(): string {
    if (!this.token.command.startsWith('\\')) return '\\' + this.token.command;

    return this.token.command;
  }

  getCopyContent(options?: CopyContentOptions): string {
    return this.getLatexContent();
  }

  getLatexContent(options?: LatexExportOptions): string {
    return this.getData();
  }
}
