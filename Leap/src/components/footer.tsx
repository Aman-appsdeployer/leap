import { Facebook, Instagram, Linkedin, LucideProps, Mail } from "lucide-react";
import React, { useEffect } from "react";
import { useActiveTab } from "./ActiveTabContext"; // Import the shared context

export const Logo = (props: LucideProps) => {
  return (
    <div>
      <img
        alt=" Logo"
        src={"/logo1.png"}
        className={
          props && props.className
            ? props.className
            : "h-14 w-auto p-2 object-contain"
        }
      />
    </div>
  );
};

export function Footer() {
  const { activeTab, setActiveTab } = useActiveTab();

  useEffect(() => {
    const handleHashChange = () =>
      setActiveTab(window.location.pathname + window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [setActiveTab]);

  const handleScrollToSection = (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    targetHash: string
  ) => {
    event.preventDefault();

    if (window.location.pathname !== "/") {
      window.location.href = `/${targetHash}`;
    } else {
      const target = document.querySelector(targetHash);
      target?.scrollIntoView({ behavior: "smooth" });
    }
    setActiveTab(`/${targetHash}`);
  };

  const isActive = (href: string) => activeTab === href;

  return (
    <footer className="bg-[#000] text-white -mt-20 font-poppins">
      <div className="container mx-auto px-4 py-10">
        {/* Logo and Social Media Section */}
        <div className="flex flex-col items-center mt-20 text-center text-white gap-10">
          <Logo className="h-14 w-auto" />
          <div className="flex gap-8">
            <a
              aria-label="Contact by Mail"
              className="text-red-600 hover:text-primary-foreground transition"
              href="mailto:support@nuqiwealth.in"
            >
              <Mail className="w-6 h-6" />
            </a>
            <a
              aria-label="Follow on Instagram"
              className="text-red-600 hover:text-primary-foreground transition"
              href="https://www.instagram.com"
            >
              <Instagram className="w-6 h-6" />
            </a>
            <a
              aria-label="Follow on Facebook"
              className="text-red-600 hover:text-primary-foreground transition"
              href="https://www.facebook.com"
            >
              <Facebook className="w-6 h-6" />
            </a>
            <a
              aria-label="Follow on Linkedin"
              className="text-red-600 hover:text-primary-foreground transition"
              href="https://www.linkedin.com"
            >
              <Linkedin className="w-6 h-6" />
            </a>
          </div>
        </div>
        {/* Navigation Links */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:flex lg:justify-center gap-10 text-base font-poppins text-center">
          <a
            href="/"
            className={`${
              isActive("/")
                ? "text-red-600 font-bold"
                : "text-white hover:text-red-600"
            }`}
            onClick={() => setActiveTab("/")}
          >
            Home
          </a>
          <a
            href="/Services"
            className={`${
              isActive("/Services")
                ? "text-red-600 font-bold"
                : "text-white hover:text-red-600"
            }`}
            onClick={() => setActiveTab("/Services")}
          >
              Services
          </a>
          <a
            href="/About"
            className={`${
              isActive("/About")
                ? "text-red-600 font-bold"
                : "text-white hover:text-red-600"
            }`}
            onClick={() => setActiveTab("/About")}
          >
            About
          </a>
          <a
            href="/blog"
            className={`${
              isActive("/blog")
                ? "text-red-600 font-bold"
                : "text-white hover:text-red-600"
            }`}
            onClick={() => setActiveTab("/blog")}
          >
            Blog
          </a>
        </div>
        {/* Disclaimer Section */}
        <div className="mt-10 text-center text-xs text-white leading-relaxed">
          <p>
            <span>
              Please visit our{" "}
              <a
                href="/disclaimer"
                target="_blank"
                className="underline underline-offset-2"
              >
                Disclaimer Notice page
              </a>{" "}
              for further information.
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
