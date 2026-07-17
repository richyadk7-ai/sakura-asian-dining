import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  showIcon?: boolean;
};

export function ExternalLink({ children, showIcon = false, className, ...props }: Props) {
  return (
    <a {...props} className={className} target="_blank" rel="noopener noreferrer">
      {children}
      {showIcon ? <ExternalLinkIcon aria-hidden="true" size={15} /> : null}
    </a>
  );
}
