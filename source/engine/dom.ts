// Minimal native-DOM helpers, replacing the handful of jQuery conveniences the
// view layer relied on.

// Parse a trusted HTML string into a single root element (jQuery `$( html )`).
export function htmlToElement(html: string): HTMLElement {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild as HTMLElement;
}

// jQuery-style visibility helpers, toggling inline `display`. These elements'
// visibility is driven entirely by inline style, so this matches the prior
// jQuery .show()/.hide()/.toggle()/.is( ':visible' ) behavior.
export const isVisible = (el: HTMLElement): boolean => el.style.display !== "none";
export const show = (el: HTMLElement): void => {
  el.style.display = "";
};
export const hide = (el: HTMLElement): void => {
  el.style.display = "none";
};
export const toggle = (el: HTMLElement): void => {
  if (isVisible(el)) hide(el);
  else show(el);
};
