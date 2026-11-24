'use client';

import type { ReactNode } from 'react';

type FormAction = (formData: FormData) => void | Promise<void>;

type HiddenFields = Record<string, string | number>;

function HiddenInputs({ fields }: { fields: HiddenFields }) {
  return (
    <>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={String(value)} />
      ))}
    </>
  );
}

/**
 * Submits its form as soon as a contained select or input changes.
 *
 * The dashboard pages are Server Components, so they cannot pass `onChange`
 * handlers to the DOM directly (React rejects event handlers on Client
 * Component props). This wrapper keeps the server-rendered inputs while
 * providing the behaviour they need.
 */
export function AutoSubmitForm({
  action,
  hidden = {},
  className,
  children,
}: {
  action: FormAction;
  hidden?: HiddenFields;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      className={className}
      onChange={(event) => event.currentTarget.requestSubmit()}
    >
      <HiddenInputs fields={hidden} />
      {children}
    </form>
  );
}

/** Renders a form whose submit button asks for confirmation first. */
export function ConfirmForm({
  action,
  hidden = {},
  confirmMessage,
  className,
  children,
}: {
  action: FormAction;
  hidden?: HiddenFields;
  confirmMessage: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <HiddenInputs fields={hidden} />
      {children}
    </form>
  );
}
