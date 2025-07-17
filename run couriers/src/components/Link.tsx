import  { ReactNode } from 'react';

interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
}

export function Link({ to, children, className }: LinkProps) {
  // This is a simple wrapper for links in our SPA
  // In a real app with a router, we'd use the router's Link component
  
  // For now, we'll just use this to handle navigation in our demo
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // For demo purposes, we simulate navigation by dispatching a custom event
    window.dispatchEvent(new CustomEvent('navigation', { 
      detail: { path: to } 
    }));
  };
  
  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
 