import type { Category, CategoryNode } from './types';

/** Build a nested tree from a flat list. Orphans (missing parent) bubble to root. */
export function buildTree(categories: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  categories.forEach(c => map.set(c.id, { ...c, children: [], depth: 0 }));

  const roots: CategoryNode[] = [];
  for (const node of map.values()) {
    if (node.parent && map.has(node.parent)) {
      map.get(node.parent)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const setDepth = (nodes: CategoryNode[], depth: number) => {
    nodes.forEach(n => {
      n.depth = depth;
      n.children.sort((a, b) => a.name.localeCompare(b.name));
      setDepth(n.children, depth + 1);
    });
  };
  roots.sort((a, b) => a.name.localeCompare(b.name));
  setDepth(roots, 0);
  return roots;
}

/** Flatten a tree to an in-order list (for select dropdowns), preserving depth. */
export function flattenTree(roots: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = [];
  const walk = (nodes: CategoryNode[]) => {
    nodes.forEach(n => { out.push(n); walk(n.children); });
  };
  walk(roots);
  return out;
}

/** Return [self, ...descendants] ids for cascading filters. */
export function descendantIds(rootId: string, categories: Category[]): string[] {
  const ids = [rootId];
  const stack = [rootId];
  while (stack.length) {
    const cur = stack.pop()!;
    categories.filter(c => c.parent === cur).forEach(c => {
      ids.push(c.id);
      stack.push(c.id);
    });
  }
  return ids;
}

/** Get human-readable breadcrumb path: ["Charging", "Cables", "USB-C"]. */
export function categoryPath(id: string, categories: Category[]): Category[] {
  const map = new Map(categories.map(c => [c.id, c]));
  const path: Category[] = [];
  let cur = map.get(id);
  let guard = 0;
  while (cur && guard++ < 32) {
    path.unshift(cur);
    cur = cur.parent ? map.get(cur.parent) : undefined;
  }
  return path;
}

/** Detect a cycle attempt (e.g. setting a parent to a descendant of self). */
export function wouldCreateCycle(id: string, newParent: string, categories: Category[]): boolean {
  if (id === newParent) return true;
  const map = new Map(categories.map(c => [c.id, c]));
  let cur = map.get(newParent);
  let guard = 0;
  while (cur && guard++ < 32) {
    if (cur.id === id) return true;
    cur = cur.parent ? map.get(cur.parent) : undefined;
  }
  return false;
}

/** Preset gradient palette the admin can pick from when creating a category. */
export const CATEGORY_GRADIENTS: { label: string; value: string }[] = [
  { label: 'Cyan → Violet',  value: 'linear-gradient(135deg,#00d4ff,#7c3aed)' },
  { label: 'Coral → Pink',   value: 'linear-gradient(135deg,#ff6b6b,#ee0979)' },
  { label: 'Mint → Lime',    value: 'linear-gradient(135deg,#11998e,#38ef7d)' },
  { label: 'Magenta → Red',  value: 'linear-gradient(135deg,#f093fb,#f5576c)' },
  { label: 'Amber → Tomato', value: 'linear-gradient(135deg,#ffd86f,#fc6262)' },
  { label: 'Sky → Aqua',     value: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
  { label: 'Lavender → Pink',value: 'linear-gradient(135deg,#a18cd1,#fbc2eb)' },
  { label: 'Rose → Gold',    value: 'linear-gradient(135deg,#fa709a,#fee140)' },
  { label: 'Indigo → Cyan',  value: 'linear-gradient(135deg,#3b82f6,#06b6d4)' },
  { label: 'Slate',          value: 'linear-gradient(135deg,#64748b,#1e293b)' }
];
