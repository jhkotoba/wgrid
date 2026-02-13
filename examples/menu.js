export const sampleMenuItems = [
  { id: "sample-crud-single", label: "Single CRUD", href: "/examples/sample-crud-single" },
  { id: "sample-crud-apply", label: "Collect and Apply", href: "/examples/sample-crud-apply" },
  { id: "sample-paging", label: "Paging Search", href: "/examples/sample-paging" },
];

export const renderSampleMenu = (containerSelector, currentId) => {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const nav = document.createElement("nav");
  nav.className = "sample-menu";
  nav.setAttribute("aria-label", "Sample pages");

  sampleMenuItems.forEach((item) => {
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.label;
    link.className = "sample-menu-link";

    if (item.id === currentId) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }

    nav.appendChild(link);
  });

  container.replaceChildren(nav);
};
