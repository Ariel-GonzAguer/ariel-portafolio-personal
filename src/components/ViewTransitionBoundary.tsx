import * as React from 'react';
import type { ComponentType, ReactNode } from 'react';

type TransitionClass =
  'auto' | 'none' | (string & {}) | Record<string, 'auto' | 'none' | (string & {})>;

type ViewTransitionProps = {
  children?: ReactNode;
  name?: string;
  enter?: TransitionClass;
  exit?: TransitionClass;
  update?: TransitionClass;
  share?: TransitionClass;
  default?: TransitionClass;
};

type ReactWithViewTransition = typeof React & {
  ViewTransition?: ComponentType<ViewTransitionProps>;
};

/**
 * View Transition de React con fallback transparente para versiones anteriores.
 *
 * React 19.3 exporta ViewTransition de forma estable. El fallback mantiene el
 * render funcional en cualquier renderer que todavía no exponga esa API.
 */
export default function ViewTransitionBoundary({ children, ...props }: ViewTransitionProps) {
  const ViewTransition = (React as ReactWithViewTransition).ViewTransition;

  if (!ViewTransition) return <>{children}</>;

  return React.createElement(ViewTransition, props, children);
}
