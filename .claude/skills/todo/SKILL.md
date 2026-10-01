---
name: todo
description: Record decisions, tasks and progress in the project's todo.txt. Use whenever the user makes or confirms a decision about the app (data model, gems, architecture, scope cuts, README items), starts or finishes a task, adds a new task/idea, or asks to "add to todo" / "/todo".
---

# Keeping todo.txt up to date

`todo.txt` (project root, git-ignored) is the author's personal tracker. Everything decided in the conversation goes there, in the author's own format. It is not the README: the README gets polished prose separately; todo.txt gets short notes.

## Format (follow exactly)

```
[x] Section                       top-level phase at column 0
    [x] Done item                 children indented 4 spaces per level
    [-] Partially done item
    [ ] Pending item
    - plain bullet                note / research item, no status
    // one-line note
    /* multi-line note,
    continued on following lines */
    // Decision: <what> — <why>
    // Open: <question still to be answered>
    // Later: <idea deferred to the future>
```

- Statuses: `[ ]` pending, `[-]` in progress / partial, `[x]` done.
- A parent is `[x]` only when all its checkbox children are `[x]`; `[-]` if some are done.
- `Decision:` only for things the user actually decided or confirmed. Anything still being discussed is `Open:`; when it gets settled, replace the `Open:` line with a `Decision:` line.
- `Later:` for deferred ideas. If it also belongs in the README's "With more time" section, add `(README: with more time)` at the end.
- Keep lines short (about 100 chars). One idea per line; use `/* */` only when a note really needs more lines.
- Put notes directly under the item they refer to, above that item's children.

## Procedure

1. Read the whole `todo.txt` first.
2. Place each entry under the most specific existing section/item. If nothing fits, add a new top-level section in a logical place (in the order the work happens) instead of appending at the very end.
3. Don't reorder, reword or "fix" the author's existing lines (including typos). Only change: status markers, `Open:` → `Decision:` replacements, and lines you add.
4. Don't duplicate: if an item already exists, update its status or add a note under it.
5. When a new decision creates work, add both the `// Decision:` note and the `[ ]` tasks it implies.
6. After editing, tell the user in 2-5 bullets what was added or changed (not the whole file).
