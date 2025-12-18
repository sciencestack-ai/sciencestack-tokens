import { ListItemToken, ListType } from '../types';
import { BaseTokenNode } from '../base/BaseTokenNode';
import { ITokenNodeFactory } from '../base/ITokenNodeFactory';
import { BaseEnvTokenNode } from '../document/BaseEnvTokenNode';
import { ListTokenNode } from './ListTokenNode';
import { AbstractTokenNode } from '../base/AbstractTokenNode';
import { CopyContentOptions, LatexExportOptions, MarkdownExportOptions } from '../export_types';

const convertNumberToChar = (index: number) => {
  return String.fromCharCode(97 + index); // a, b, c, ...
};

export class ListItemTokenNode extends BaseEnvTokenNode {
  constructor(
    token: ListItemToken,
    id?: string,
    protected tokenFactory?: ITokenNodeFactory
  ) {
    super(token, id, tokenFactory);
  }

  get token(): ListItemToken {
    return this._token as ListItemToken;
  }

  getCopyContent(options?: CopyContentOptions): string {
    const data = this.getContentData();
    return BaseTokenNode.GetCopyContent(data, options);
  }

  getLatexContent(options?: LatexExportOptions): string {
    const titleData = BaseTokenNode.GetCopyContent(this.getTitleData());
    let title = titleData.length > 0 ? `[${titleData}]` : '';

    return `\\item${title} ${BaseTokenNode.GetLatexContent(this.getContentData(), options)}`;
  }

  getTooltipContent(): string | null {
    let content = '';
    if (this.hasChildren()) {
      content = this.getChildren()
        .map((child) => child.getCopyContent() ?? '')
        .join('\n');
    }
    if (content.length > 200) {
      content = content.slice(0, 200) + '...';
    }
    return content;
  }

  getReferenceText() {
    const titleStr = this.getTitleStr();
    if (titleStr.length > 0) {
      return 'Item ' + titleStr;
    }
    const parent = this.parent;
    if (parent instanceof ListTokenNode) {
      const listType = parent.listType;
      const index = parent.getListItemIndex(this);
      if (index !== -1) {
        if (listType === ListType.ENUMERATE) {
          const depth = parent.computeDepth();
          // in latex, nested enumerate lists return as a/b/c
          if (depth >= 1) {
            return `Item ${convertNumberToChar(index)}`;
          }
        }
        return `Item ${index + 1}`;
      }
    }
    return null;
  }

  getMarkdownContent(options?: MarkdownExportOptions): string {
    const parent = this.parent;
    const titleData = this.getTitleData();
    const contentData = this.getContentData();

    let marker = '-'; // default bullet
    let indentation = '';

    if (parent instanceof ListTokenNode) {
      const listType = parent.listType;
      const depth = parent.computeDepth();
      const data = parent.getData();
      const index = data.indexOf(this);

      // Calculate indentation (2 spaces per level)
      indentation = '  '.repeat(depth);

      if (listType === ListType.ENUMERATE) {
        marker = `${index + 1}.`;
      } else if (listType === ListType.ITEMIZE) {
        marker = '-';
      } else if (listType === ListType.DESCRIPTION) {
        // Description list: **term**: description
        const titleStr = AbstractTokenNode.GetMarkdownContent(titleData, options);
        const contentStr = AbstractTokenNode.GetMarkdownContent(contentData, options);
        return `${indentation}**${titleStr}**: ${contentStr}`;
      }
    }

    const contentStr = AbstractTokenNode.GetMarkdownContent(contentData, options);
    return `${indentation}${marker} ${contentStr.trim()}`;
  }
}
