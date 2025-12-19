import {
  BaseToken,
  TokenType,
  DocumentToken,
  SectionToken,
  EquationToken,
  CodeToken,
  AlgorithmToken,
  TextToken,
  QuoteToken,
  CitationToken,
  ReferenceToken,
  UrlToken,
  ListToken,
  ListItemToken,
  TableToken,
  SubTableToken,
  TabularToken,
  CaptionToken,
  GroupToken,
  FootnoteToken,
  FigureToken,
  SubFigureToken,
  IncludeGraphicsToken,
  IncludePdfToken,
  DiagramToken,
  MathEnvToken,
  EnvironmentToken,
  AppendixToken,
  CommandToken,
  AlgorithmicToken,
  IToken,
  MetadataToken,
  AbstractToken,
  TitleToken,
  BibItemToken,
  BibliographyToken,
  EquationArrayToken,
  AuthorToken,
  METADATA_TOKEN_TYPES,
} from "../types";
import {
  AbstractTokenNode,
  BaseTokenNode,
  SectionTokenNode,
  DocumentTokenNode,
  EquationTokenNode,
  CodeTokenNode,
  AlgorithmTokenNode,
  AlgorithmicTokenNode,
  TextTokenNode,
  QuoteTokenNode,
  CitationTokenNode,
  ReferenceTokenNode,
  UrlTokenNode,
  ListTokenNode,
  ListItemTokenNode,
  TableTokenNode,
  SubTableTokenNode,
  TabularTokenNode,
  CaptionTokenNode,
  GroupTokenNode,
  FootnoteTokenNode,
  FigureTokenNode,
  SubFigureTokenNode,
  IncludeGraphicsTokenNode,
  IncludePdfTokenNode,
  DiagramTokenNode,
  MathEnvTokenNode,
  EnvironmentTokenNode,
  AppendixTokenNode,
  CommandTokenNode,
  MetadataTokenNode,
  AbstractSectionTokenNode,
  TitleTokenNode,
  BibitemTokenNode,
  BibliographyTokenNode,
  EquationArrayTokenNode,
  AuthorTokenNode,
} from "../index";
import { ITokenNodeFactory } from "./ITokenNodeFactory";

// Define metadata token types array

export class TokenNodeFactory implements ITokenNodeFactory {
  private _excludedTokenTypes: TokenType[] = [];

  setExcludedTokenTypes(types: TokenType[]): void {
    this._excludedTokenTypes = types;
  }

  createNode(token: IToken, id?: string): AbstractTokenNode | null {
    if (!token || !token.type) return null;
    if (this._excludedTokenTypes.includes(token.type)) {
      return null;
    }

    if (METADATA_TOKEN_TYPES.includes(token.type)) {
      return new MetadataTokenNode(token as MetadataToken, id, this);
    } else {
      switch (token.type) {
        case TokenType.DOCUMENT:
          return new DocumentTokenNode(token as DocumentToken, id, this);
        case TokenType.SECTION:
          return new SectionTokenNode(token as SectionToken, id, this);
        case TokenType.TITLE:
          return new TitleTokenNode(token as TitleToken, id, this);
        case TokenType.AUTHOR:
          return new AuthorTokenNode(token as AuthorToken, id, this);
        case TokenType.ABSTRACT:
          return new AbstractSectionTokenNode(token as AbstractToken, id, this);
        case TokenType.EQUATION:
          return new EquationTokenNode(token as EquationToken, id, this);
        case TokenType.EQUATION_ARRAY:
          return new EquationArrayTokenNode(
            token as EquationArrayToken,
            id,
            this
          );
        case TokenType.CODE:
          return new CodeTokenNode(token as CodeToken, id, this);
        case TokenType.ALGORITHM:
          return new AlgorithmTokenNode(token as AlgorithmToken, id, this);
        case TokenType.ALGORITHMIC:
          return new AlgorithmicTokenNode(token as AlgorithmicToken, id, this);
        case TokenType.TEXT:
          return new TextTokenNode(token as TextToken, id, this);
        case TokenType.QUOTE:
          return new QuoteTokenNode(token as QuoteToken, id, this);
        case TokenType.CITATION:
          return new CitationTokenNode(token as CitationToken, id, this);
        case TokenType.REF:
          return new ReferenceTokenNode(token as ReferenceToken, id, this);
        case TokenType.URL:
          return new UrlTokenNode(token as UrlToken, id, this);
        case TokenType.LIST:
          return new ListTokenNode(token as ListToken, id, this);
        case TokenType.ITEM:
          return new ListItemTokenNode(token as ListItemToken, id, this);
        case TokenType.TABLE:
          return new TableTokenNode(token as TableToken, id, this);
        case TokenType.SUBTABLE:
          return new SubTableTokenNode(token as SubTableToken, id, this);
        case TokenType.TABULAR:
          return new TabularTokenNode(token as TabularToken, id, this);
        case TokenType.CAPTION:
          return new CaptionTokenNode(token as CaptionToken, id, this);
        case TokenType.GROUP:
          return new GroupTokenNode(token as GroupToken, id, this);
        case TokenType.FOOTNOTE:
          return new FootnoteTokenNode(token as FootnoteToken, id, this);
        case TokenType.FIGURE:
          return new FigureTokenNode(token as FigureToken, id, this);
        case TokenType.SUBFIGURE:
          return new SubFigureTokenNode(token as SubFigureToken, id, this);
        case TokenType.INCLUDEGRAPHICS:
          return new IncludeGraphicsTokenNode(
            token as IncludeGraphicsToken,
            id,
            this
          );
        case TokenType.INCLUDEPDF:
          return new IncludePdfTokenNode(token as IncludePdfToken, id, this);
        case TokenType.DIAGRAM:
          return new DiagramTokenNode(token as DiagramToken, id, this);
        case TokenType.MATH_ENV:
          return new MathEnvTokenNode(token as MathEnvToken, id, this);
        case TokenType.ENVIRONMENT:
          return new EnvironmentTokenNode(token as EnvironmentToken, id, this);
        case TokenType.APPENDIX:
          return new AppendixTokenNode(token as AppendixToken, id, this);
        case TokenType.COMMAND:
          return new CommandTokenNode(token as CommandToken, id, this);
        case TokenType.BIBITEM:
          return new BibitemTokenNode(token as BibItemToken, id, this);
        case TokenType.BIBLIOGRAPHY:
          return new BibliographyTokenNode(token as BibliographyToken, id, this);
        default:
          console.warn(`Unhandled token type: ${token.type}`);
          return null;
        // return new BaseTokenNode(token, id);
      }
    }
  }
}
