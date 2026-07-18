// Any single network call gets this long to resolve before we treat it as
// failed. supabase-js has no built-in request timeout, so without this a
// slow or unresponsive backend (e.g. under concurrent load) leaves whatever
// awaited it hanging indefinitely — a stuck button, an infinite spinner, or
// a user who can never sign out.
export const REQUEST_TIMEOUT_MS = 15000;

export function withTimeout<T>(promise: PromiseLike<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out. Please try again.')), ms);
    Promise.resolve(promise).then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}
