const svgNS = 'http://www.w3.org/2000/svg';

export const fragment = 'fragment';

export type DOMTree = {
  tagName: string;
  attribs: Record<string, string>,
  children: DOMTree[]
}

export function h(tagName: string, attribs: Record<string, string>, ...children: DOMTree[]): DOMTree {
  return {
    tagName, attribs, children
  };
}

export function renderTree(node: Element|DocumentFragment, tree: DOMTree) {
  const namespace = tree.tagName === 'svg' ? svgNS : node.namespaceURI;
  let el: Element|DocumentFragment;
  if (tree.tagName === fragment) {
    el = new DocumentFragment();
  } else {
    el = document.createElementNS(namespace, tree.tagName);
    for (const [attrib, value] of Object.entries(tree.attribs || {})) {
      el.setAttribute(attrib, value);
    }
  }
  for (const child of tree.children) {
    if (typeof child === "string") {
      el.appendChild(document.createTextNode(child));
      continue;
    }
    renderTree(el instanceof DocumentFragment ? node : el, child);
  }

  node.appendChild(el);
}
