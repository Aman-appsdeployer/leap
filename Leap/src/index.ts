export interface ArticleCardProps {
    date: string;
    title: string;
    imageUrl: string;
    readMoreLink?: string;
  }
  
  export interface NavLinkProps {
    label: string;
    isActive?: boolean;
    href: string;
  }
  
  export interface NavButtonProps {
    label: string;
    onClick: () => void;
  }

  export interface AuthButtonProps {
    text: string;
  }

export * from "./components/FAQSection";
export * from "./components/FAQCard"
export * from "./types";