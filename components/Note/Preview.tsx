import React from "react";
import {unified} from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeReact from "rehype-react";
import rehypeHighlight from "rehype-highlight";

const filterWhitespace = (node: React.ReactNode) =>
  !(typeof node === "string" && node.trim() === "");

const Table: React.FC = ({ children, ...props }) => (
  <table {...props}>{React.Children.toArray(children).filter(filterWhitespace)}</table>
);

const TableHead: React.FC = ({ children, ...props }) => (
  <thead {...props}>{React.Children.toArray(children).filter(filterWhitespace)}</thead>
);

const TableBody: React.FC = ({ children, ...props }) => (
  <tbody {...props}>{React.Children.toArray(children).filter(filterWhitespace)}</tbody>
);

const TableRow: React.FC = ({ children, ...props }) => (
  <tr {...props}>{React.Children.toArray(children).filter(filterWhitespace)}</tr>
);

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(rehypeHighlight)
  .use(rehypeReact, {
    createElement: React.createElement,
    components: {
      table: Table,
      thead: TableHead,
      tbody: TableBody,
      tr: TableRow
    }
  });

const MarkdownView: React.FC<{ value: string }> = ({ value }) => (
  <div>{processor.processSync(value).result}</div>
);

export default MarkdownView;
