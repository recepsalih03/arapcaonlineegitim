import * as React from "react";

/**
 * Minik `asChild` desteği: tek çocuğa kendi prop'larını devreder.
 * Radix'e bağımlı olmamak için elle yazıldı — ihtiyacımız bu kadar.
 */
export function Slot({
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  if (!React.isValidElement(children)) return null;

  const child = children as React.ReactElement<Record<string, unknown>>;
  const childProps = child.props;

  return React.cloneElement(child, {
    ...props,
    ...childProps,
    className: [props.className, childProps.className as string | undefined]
      .filter(Boolean)
      .join(" "),
  });
}
