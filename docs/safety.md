# Safety

- **Loopback bind only.** The server binds `127.0.0.1` by default; `APG_BIND` is the explicit opt-in the container uses (`0.0.0.0` inside the container, because the compose publish is loopback-only). The compose file publishes `127.0.0.1:7826:7826` only, pinned by a test.
- **Host check.** The `Host` header must be a loopback name or one of the comma-separated names in `LAB_ALLOWED_HOSTS` (DNS-rebinding defence); anything else is a 403.
- **Same-origin writes.** Every POST/PUT/PATCH/DELETE is refused when the `Sec-Fetch-Site` is cross-site or the `Origin` host does not match (with the shared lab-proxy's `X-Forwarded-Host` trusted).
- **Netguard: zero real outbound calls.** Fetch, TCP socket, socket-by-IP, DNS lookup/resolve and UDP to any non-loopback host are blocked, with a self-test the doctor runs and a test asserting zero attempts. This lab is mock-only by design: there is no live engine and no console/gateway it could call in any mode. `APG_MODE_REAL=1` only enables the rule-19 Real switch; the page stays the same simulation (the REAL modal says so).
- **Reserved hosts only in text.** Every hostname in shipped page text is scanned: anything not `.invalid`/`.example`/loopback fails the doctor and the tests. No tenant, customer or hostname from any real environment ships.
- **Mock keys.** Any key-looking string is an obviously fake `sk-MOCK-…` value; `scanKeys` fails on any other `sk-` shape. No credential exists anywhere in the lab.
- **Bounded input.** The only caller-supplied free text (workspace id) is validated `^[a-z0-9-]{1,40}$`; workspaces are capped in count (500), age (1 h) and per-workspace runs (20); JSON body caps apply. No `eval`, `Function` or `vm` anywhere; the story renderer is a single iterative pass.
- **Rendered inert.** Everything is React text through the `visible()` guard (control and bidirectional characters shown as escapes); never `dangerouslySetInnerHTML`.
- **Container.** Non-root (`USER node`), read-only filesystem, `cap_drop: [ALL]`, `no-new-privileges`, `restart: unless-stopped`; Docker publishes the port on `127.0.0.1` only.
