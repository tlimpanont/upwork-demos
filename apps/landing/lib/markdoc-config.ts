import Markdoc, { Tag } from "@markdoc/markdoc";

// Override the default fence node so triple-backtick blocks tagged with
// `mermaid` render through the MermaidDiagram React component instead of as
// a code block. Other fence languages render normally.
export const markdocConfig: Parameters<typeof Markdoc.transform>[1] = {
  nodes: {
    fence: {
      ...Markdoc.nodes.fence,
      transform(node, config) {
        if (node.attributes.language === "mermaid") {
          return new Tag("MermaidDiagram", { source: node.attributes.content });
        }
        return Markdoc.nodes.fence.transform!(node, config);
      },
    },
  },
};
