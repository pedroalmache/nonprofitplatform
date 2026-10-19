export function trapDialogKeydown(event: KeyboardEvent, onEscape: () => void): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    onEscape();
    return;
  }

  if (event.key !== 'Tab') {
    return;
  }

  const panel = event.currentTarget;
  if (!(panel instanceof HTMLElement)) {
    return;
  }

  const focusable = [
    ...panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])',
    ),
  ];
  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !panel.contains(active))) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

export function focusFirstField(panel: HTMLElement | undefined): void {
  queueMicrotask(() => {
    panel
      ?.querySelector<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), textarea:not([disabled])',
      )
      ?.focus();
  });
}
