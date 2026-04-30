// react-router-dom stubs.
//
// Many Figma Make exports import components from `react-router-dom`. None of
// them have a meaningful Service Portal equivalent — the SDK doesn't ship a
// router, and AngularJS uses URL-based routing handled outside the widget.
// Without a stub, our parser falls through to the "unknown-component"
// branch, which dumps every JSX prop into the resulting tag and emits
// fragments like `element="{{ <Home /> }}"` that AngularJS leaves as
// literal text.
//
// Strategy per component:
//   - **transparent**  render only children, no wrapper. Use for layout
//                      wrappers like <Routes>, <BrowserRouter>, <Route>,
//                      <RouterProvider>. <Outlet> also collapses into
//                      its children — the routing shim has already
//                      flattened the index route into App's body, so an
//                      Outlet at this point should yield whatever is
//                      below it.
//   - **link**         render as a real <a href="…"> with the `to` prop
//                      mapped to `href`. Use for <Link> and <NavLink>.
//   - **skip**         render nothing. Use for components that have no
//                      visible output, like <Navigate> (redirect).

export type ReactRouterStrategy = 'transparent' | 'link' | 'skip';

const STUBS: Record<string, ReactRouterStrategy> = {
  // Layout / structural — render their children only.
  Route: 'transparent',
  Routes: 'transparent',
  Outlet: 'transparent',
  BrowserRouter: 'transparent',
  HashRouter: 'transparent',
  MemoryRouter: 'transparent',
  Router: 'transparent',
  RouterProvider: 'transparent',
  ScrollRestoration: 'transparent',

  // Anchor-like — render as <a href>.
  Link: 'link',
  NavLink: 'link',

  // Imperative redirects — no DOM output.
  Navigate: 'skip',
  Redirect: 'skip',
};

export function getReactRouterStrategy(name: string): ReactRouterStrategy | null {
  return STUBS[name] ?? null;
}
