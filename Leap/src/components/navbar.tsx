
import { Popover, Transition } from "@headlessui/react";
import { Menu, X } from "lucide-react";
import { Fragment, ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useActiveTab } from "./ActiveTabContext"; // Import the shared context


// NavItem Component
function NavItem({
  href,
  children,
  isActive,
  onClick,
}: {
  href: string;
  children: ReactNode;
  isActive: boolean;
  onClick: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}) {
  return (
    <li className="px-4">
      <a
        href={href}
        onClick={onClick}
        className={`block px-2 py-2 text-base font-bold transition ${isActive ? "text-red-600" : "text-white hover:text-red-600"
          }`}
      >
        {children}
      </a>
    </li>
  );
}
// Desktop Navigation
function DesktopNavigation() {
  const { activeTab, setActiveTab } = useActiveTab();
  const location = useLocation();

  useEffect(() => {
    setActiveTab(location.pathname + location.hash);
  }, [location.pathname, location.hash, setActiveTab]);

  const handleScrollToSection = (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    href: string
  ) => {
    event.preventDefault();

    const [path, hash] = href.split("#");
    if (path && window.location.pathname !== path) {
      window.location.href = `${path}#${hash}`;
    } else {
      const target = document.querySelector(`#${hash}`);
      target?.scrollIntoView({ behavior: "smooth" });
    }

    setActiveTab(href);
  };

  return (
    <nav className="hidden md:flex tracking-wide font-poppins">
      <ul className="flex items-center -space-x-4 tracking-wider text-white text-[26px]">
        <NavItem
          href="/"
          isActive={activeTab === "/" || activeTab === "/#"}
          onClick={() => setActiveTab("/")}>
          HOME
        </NavItem>

        {/* Activities Dropdown */}
        <li className="relative group px-4">
          <a
            href="/#advisory"
            onClick={(e) => handleScrollToSection(e, "/#advisory")}
            className={`block px-2 py-2 text-base font-bold transition ${activeTab === "/#advisory" ? "text-red-600" : "text-white hover:text-red-600"}`}
          >
            ACTIVITIES
          </a>
          {/* Submenu for Activities */}
          <div className="absolute left-0 w-48 bg-black text-white border border-red-600 rounded-xl p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
            <ul>
              <NavItem
                href="/#advisory/subpage1"
                isActive={activeTab === "/#advisory/subpage1"}
                onClick={(e) => handleScrollToSection(e, "/#advisory/subpage1")}>
                LeaP-Quest
              </NavItem>
              <NavItem
                href="/#advisory/subpage2"
                isActive={activeTab === "/#advisory/subpage2"}
                onClick={(e) => handleScrollToSection(e, "/#advisory/subpage2")}>
                Webinar
              </NavItem>
              <NavItem
                href="/#advisory/subpage3"
                isActive={activeTab === "/#advisory/subpage3"}
                onClick={(e) => handleScrollToSection(e, "/#advisory/subpage3")}>
                MELA
              </NavItem>
              <NavItem
                href="/#advisory/subpage3"
                isActive={activeTab === "/#advisory/subpage3"}
                onClick={(e) => handleScrollToSection(e, "/#advisory/subpage3")}>
                CAMP
              </NavItem>
            </ul>
          </div>
        </li>
        <NavItem
          href="/artefacts"
          isActive={activeTab === "/artefacts"}
          onClick={(e) => handleScrollToSection(e, "/artefacts")}>
          ARTEFACTS
        </NavItem>

        {/* Resources Dropdown */}
        <li className="relative group px-4">
          <a
            href="/#resources"
            onClick={(e) => handleScrollToSection(e, "/#resources")}
            className={`block px-2 py-2 text-base font-bold transition ${activeTab === "/#resources" ? "text-red-600" : "text-white hover:text-red-600"}`}
          >
            RESOURCES
          </a>
          {/* Submenu for Resources */}
          <div className="absolute left-0 w-48 bg-black text-white border border-red-600 rounded-xl p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
            <ul>
              <NavItem
                href="/#resources/subpage1"
                isActive={activeTab === "/#resources/subpage1"}
                onClick={(e) => handleScrollToSection(e, "/#resources/subpage1")}>
               Lesson Plans
              </NavItem>
              <NavItem
                href="/#resources/subpage2"
                isActive={activeTab === "/#resources/subpage2"}
                onClick={(e) => handleScrollToSection(e, "/#resources/subpage2")}>
                CETE  RTICT RESOURCES
              </NavItem>
             
            </ul>
          </div>
        </li>
        <NavItem
          href="/story"
          isActive={activeTab === "/story"}
          onClick={() => setActiveTab("/story")}>
          STORIES FROM THE FIELD
        </NavItem>
      </ul>
    </nav>
  );
}


// Mobile Navigation
function MobileNavigation() {
  const { setActiveTab } = useActiveTab();

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

  return (
    <div className="lg:hidden font-poppins">
      <Popover>
        <Popover.Button>
          <Menu className="h-6 w-6 text-white" />
        </Popover.Button>
        <Transition.Root>
          <Transition.Child
            as={Fragment}
            enter="duration-150 ease-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="duration-150 ease-in"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Popover.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="duration-150 ease-out"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="duration-150 ease-in"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Popover.Panel className="absolute top-0 left-0 w-full bg-black p-4">
              <div className="flex justify-between items-center">
                <Popover.Button>
                  <X className="h-6 w-6 text-white" />
                </Popover.Button>
              </div>
              <nav className="mt-4 tracking-wide">
                <ul className="space-y-4 tracking-wide">
                  <NavItem href="/" isActive={false} onClick={() => setActiveTab("/")}>
                    Home
                  </NavItem>
                  <NavItem
                    href="/"
                    isActive={false}
                    onClick={(e) => handleScrollToSection(e, "/")}>
                    ACTIVITIES
                  </NavItem>
                  <NavItem
                    href="/artefacts"
                    isActive={false}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/artefacts");
                      setActiveTab("/artefacts");
                    }}
                  >
                    Artefacts
                  </NavItem>

                  <NavItem href="/iris" isActive={false} onClick={() => setActiveTab("/iris")}>
                    RESOURCES

                  </NavItem>
                  
                  <NavItem
                    href="/story"
                    isActive={false}
                    onClick={() => setActiveTab("/story")}>
                    STORIES FROM THE FIELD
                  </NavItem>
                </ul>
              </nav>
            </Popover.Panel>
          </Transition.Child>
        </Transition.Root>
      </Popover>
    </div>
  );
}

// Home Logo Component
function HomeLogo() {
  return (
    <Link to="/" className="block">
      <img
        src="/logo1.png"
        alt="Leap Logo"
        className="h-8 sm:h-10 -mr-5 md:h-12 w-auto lg:ml-20 object-contain"
      />
    </Link>
  );
}

// Main Navbar Component
export function Navbar() {
  const { activeTab } = useActiveTab();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const target = document.querySelector(hash);
      target?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab]);

  return (
    <header className="fixed top-0 w-full z-50 bg-black backdrop-blur-xl bg-opacity-50 border-opacity-50 border-b-[1px] border-[#4d4d4d] shadow-lg">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between font-poppins">
        {/* Logo */}
        <div className="flex-shrink-0">
          <HomeLogo />
        </div>

        {/* Desktop Navigation (Visible only on desktop) */}
        <div className="hidden lg:flex flex-grow justify-center">
          <DesktopNavigation />
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3 lg:space-x-4 lg:mr-5">
          <div className="lg:hidden order-3">
            <MobileNavigation />
          </div>
        </div>
      </div>
    </header>
  );
}