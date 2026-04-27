import { isLoggedIn, logout } from "./auth.js";

// Determine if we're on a page in the pages/ directory
const isInPagesDirectory = (): boolean => {
  const path = window.location.pathname;
  return path.includes("/pages/");
};

// Get the appropriate path prefix based on current location
const getPathPrefix = (): string => {
  return isInPagesDirectory() ? "" : "pages/";
};

// Get current page filename
const getCurrentPage = (): string => {
  const path = window.location.pathname;
  const fileName = path.split("/").pop() || "index.html";
  return fileName;
};

// Check if a link is active based on current URL
const isActivePage = (linkPath: string): boolean => {
  const currentPage = getCurrentPage();

  if (
    linkPath === "index.html" &&
    (currentPage === "" || currentPage === "index.html")
  ) {
    return true;
  }

  return currentPage === linkPath;
};

// Generate navbar HTML
const generateNavbar = (): string => {
  const isLogged = isLoggedIn();
  const pathPrefix = getPathPrefix();
  const homePath = "/";

  let navItems = "";

  // Home link (always visible)
  navItems += `
    <li class="nav-item">
      <a class="nav-link ${isActivePage("index.html") ? "active" : ""}" 
         aria-current="page" href="${homePath}">Home</a>
    </li>
  `;

  if (isLogged) {
    // Show these items only when logged in
    navItems += `
      <li class="nav-item">
        <a class="nav-link ${isActivePage("apartment.html") ? "active" : ""}" 
           href="${pathPrefix}apartment.html">Apartment</a>
      </li>
      <li class="nav-item">
        <a class="nav-link ${isActivePage("profile.html") ? "active" : ""}" 
           href="${pathPrefix}profile.html">Profile</a>
      </li>
      <li class="nav-item">
        <a class="nav-link ms-lg-3" href="#" onclick="onLogout(event)">Logout</a>
      </li>
    `;
  } else {
    // Show these items only when not logged in
    navItems += `
      <li class="nav-item">
        <a class="nav-link ${isActivePage("login.html") ? "active" : ""}" 
           href="${pathPrefix}login.html">Login</a>
      </li>
      <li class="nav-item">
        <a class="nav-link btn-register ms-lg-3 ${isActivePage("register.html") ? "active" : ""}" 
           href="${pathPrefix}register.html">Register</a>
      </li>
    `;
  }

  return navItems;
};

// Initialize navbar on page load
const initNavbar = (): void => {
  const navbarNav = document.getElementById("navbarNav");

  if (navbarNav) {
    const navList = navbarNav.querySelector(".navbar-nav");
    if (navList) {
      navList.innerHTML = generateNavbar();
    }
  }
};

(window as any).onLogout = (event: Event): void => {
  event.preventDefault();
  logout();
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initNavbar);
