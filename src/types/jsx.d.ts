import type { ColorResolvable } from "discord.js";

export interface EmbedProps {
  title?: string;
  description?: string;
  color?: ColorResolvable;
  url?: string;
  timestamp?: Date | boolean;
  thumbnail?: string;
  image?: string;
  children?: any[];
}

export interface FieldProps {
  name: string;
  value: string;
  inline?: boolean;
}

export interface FooterProps {
  text: string;
  iconURL?: string;
}

export interface AuthorProps {
  name: string;
  iconURL?: string;
  url?: string;
}

export interface JSXElement {
  type: any;
  props: any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }

    type Element = JSXElement | EmbedProps | FieldProps | FooterProps | AuthorProps;

    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

export {};
