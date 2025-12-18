import { IToken } from '../types';
import { AbstractTokenNode } from './AbstractTokenNode';

export interface ITokenNodeFactory {
  createNode(token: IToken, id?: string): AbstractTokenNode | null;
}
