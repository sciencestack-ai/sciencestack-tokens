import { EnvironmentToken } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { LatexExportOptions } from '../export_types';

export class EnvironmentTokenNode extends BaseTokenNode {
  constructor(
    token: EnvironmentToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): EnvironmentToken {
    return this._token as EnvironmentToken;
  }

  get name() {
    return this.token.name;
  }

  getLatexContent(options?: LatexExportOptions): string {
    const env_name = this.name ?? 'environment';
    const prefix = `\\begin{${env_name}}`;
    const suffix = `\\end{${env_name}}`;

    const labels = this.getLabelsLatex();
    const content = super.getLatexContent(options);

    return `${prefix}\n${labels}${content}\n${suffix}\n`;
  }
}
