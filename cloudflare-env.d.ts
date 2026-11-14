/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  HOOPS_ROOM: DurableObjectNamespace;
  HOOPS_LOBBY: DurableObjectNamespace;
  ASSETS?: Fetcher;
  WORKER_SELF_REFERENCE?: Fetcher;
}

declare module "./.open-next/worker.js" {
  const openNextWorker: {
    fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext): Promise<Response>;
  };
  export default openNextWorker;
}
