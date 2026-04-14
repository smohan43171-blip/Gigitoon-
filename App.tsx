import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query  import Home from "./Home";
import UploadPage from "./Upload";
import ViewPage from "./View";
import AdminPage from "./Admin";

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/upload" component={Upload} />
        <Route path="/view/:id" component={View} />
        <Route path="/admin" component={Admin} />
        <Route>
          <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <h1 className="text-4xl font-display font-bold gradient-text mb-2">404</h1>
            <p className="text-subtle mb-4">Page not found</p>
            <a href="/" className="text-accent hover:underline text-sm">Go home</a>
          </div>
        </Route>
      </Switch>
    </QueryClientProvider>
  );
}
