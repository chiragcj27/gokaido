"use client";

import { useState } from "react";

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

type Slot = { group: string; index: number };

/**
 * Native HTML5 drag-and-drop for table rows. Rows only become draggable while
 * their handle is pressed, so inputs and buttons in the row stay usable.
 * Drops are confined to the same `group` (e.g. one category's subcategories).
 */
export function useDragReorder(onMove: (group: string, from: number, to: number) => void) {
  const [armed, setArmed] = useState<Slot | null>(null);
  const [dragging, setDragging] = useState<Slot | null>(null);
  const [over, setOver] = useState<Slot | null>(null);

  const same = (a: Slot | null, group: string, index: number) =>
    a !== null && a.group === group && a.index === index;

  function reset() {
    setArmed(null);
    setDragging(null);
    setOver(null);
  }

  function handleProps(group: string, index: number) {
    return {
      onMouseDown: () => setArmed({ group, index }),
      onMouseUp: () => setArmed(null),
    };
  }

  function rowProps(group: string, index: number) {
    const classes = [
      same(dragging, group, index) && "row-dragging",
      dragging && !same(dragging, group, index) && same(over, group, index) && "row-drop-target",
    ].filter(Boolean);

    return {
      draggable: same(armed, group, index),
      className: classes.join(" ") || undefined,
      onDragStart: (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = "move";
        // Firefox won't start a drag without some data set.
        e.dataTransfer.setData("text/plain", String(index));
        setDragging({ group, index });
      },
      onDragOver: (e: React.DragEvent) => {
        if (!dragging || dragging.group !== group) return;
        e.preventDefault();
        if (!same(over, group, index)) setOver({ group, index });
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        if (dragging && dragging.group === group && dragging.index !== index) {
          onMove(group, dragging.index, index);
        }
        reset();
      },
      onDragEnd: reset,
    };
  }

  return { handleProps, rowProps };
}
