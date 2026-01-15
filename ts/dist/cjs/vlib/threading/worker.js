var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Worker: () => Worker
});
module.exports = __toCommonJS(stdin_exports);
var import_url = require("url");
var import_worker_threads = require("worker_threads");
class Worker {
  worker_path;
  default_timeout;
  max_concurrency;
  name;
  worker_data;
  type;
  workers_count;
  active_jobs;
  job_queue;
  // Ephemeral-mode workers (one worker per job).
  ephemeral_workers;
  // Persistent worker pool and active job mapping.
  persistent_pool;
  persistent_job_map;
  shutting_down;
  /**
   * Create a new Worker instance.
   *
   * @param options Configuration options for the worker pool.
   */
  constructor(options) {
    this.worker_path = options.worker_path;
    this.default_timeout = options.default_timeout ?? 6e4;
    this.name = options.name;
    this.worker_data = options.worker_data;
    this.type = options.type ?? "persistent";
    this.max_concurrency = "max_concurrency" in options ? Math.max(1, options.max_concurrency ?? 4) : 4;
    this.workers_count = "workers" in options ? Math.max(1, options.workers ?? 4) : 4;
    this.active_jobs = 0;
    this.job_queue = [];
    this.ephemeral_workers = /* @__PURE__ */ new Set();
    this.persistent_pool = [];
    this.persistent_job_map = /* @__PURE__ */ new Map();
    this.shutting_down = false;
  }
  /**
   * Enqueue a new job to be executed in a worker thread.
   *
   * Returns a promise that resolves with the worker result
   * or rejects with a {@link Worker.Error} if the worker fails,
   * exits unexpectedly, times out, or the job is aborted.
   *
   * @param payload Job payload passed to the worker handler.
   * @param options Per-job options, such as timeout and abort signal.
   */
  run(payload, options = {}) {
    if (this.shutting_down) {
      return Promise.reject(new Worker.Error("Worker pool is shutting down", this.worker_path));
    }
    if (options.signal && options.signal.aborted) {
      return Promise.reject(new Worker.Error("Worker job aborted", this.worker_path));
    }
    const job = {
      payload,
      resolve: () => void 0,
      reject: () => void 0,
      timeout: options.timeout,
      signal: options.signal
    };
    const promise = new Promise((resolve, reject) => {
      job.resolve = resolve;
      job.reject = reject;
    });
    this.job_queue.push(job);
    this.process_queue();
    return promise;
  }
  /**
   * Retrieve the current statistics for this worker instance.
   *
   * This can be useful for monitoring and instrumentation.
   */
  get_stats() {
    if (this.type === "ephemeral") {
      return {
        type: "ephemeral",
        active_jobs: this.active_jobs,
        queued_jobs: this.job_queue.length,
        max_concurrency: this.max_concurrency,
        name: this.name
      };
    } else {
      return {
        type: "persistent",
        active_jobs: this.active_jobs,
        queued_jobs: this.job_queue.length,
        workers_count: this.workers_count,
        name: this.name
      };
    }
  }
  /**
   * Clear all queued jobs by rejecting them with a WorkerError.
   *
   * Running jobs are not affected.
   *
   * This is useful if you are shutting down your application and do not want
   * to start new workers for queued jobs.
   *
   * @param reason Optional explanation for why the queue is being drained.
   */
  drain_queue(reason = "Worker queue drained") {
    const error = new Worker.Error(reason, this.worker_path);
    while (this.job_queue.length > 0) {
      const job = this.job_queue.shift();
      job.reject(error);
    }
  }
  /**
   * Gracefully (best-effort) shut down the worker pool.
   *
   * - Queued jobs are rejected immediately.
   * - Active jobs are rejected and their underlying worker threads are terminated.
   *
   * Ephemeral workers are terminated job-by-job; persistent workers are all
   * terminated and the pool is not recreated.
   *
   * @param reason Optional explanation for why the pool is shutting down.
   */
  async shutdown(reason = "Worker shutdown") {
    this.shutting_down = true;
    this.drain_queue(reason);
    if (this.type === "persistent") {
      const terminate_promises = [];
      for (const node_worker of this.persistent_pool) {
        const state = this.persistent_job_map.get(node_worker);
        if (state && !state.settled) {
          state.settled = true;
          const error = new Worker.Error(reason, this.worker_path);
          state.job.reject(error);
          this.cleanup_persistent_job_state(node_worker, state);
        }
        terminate_promises.push(node_worker.terminate().catch(() => 0));
      }
      this.persistent_pool = [];
      this.persistent_job_map.clear();
      await Promise.all(terminate_promises);
    } else {
      const terminate_promises = [];
      for (const node_worker of this.ephemeral_workers) {
        terminate_promises.push(node_worker.terminate().catch(() => 0));
      }
      this.ephemeral_workers.clear();
      await Promise.all(terminate_promises);
    }
  }
  /**
   * Internal queue processor that ensures we never exceed the configured concurrency.
   *
   * In ephemeral mode, this spawns new worker threads until max_concurrency is reached.
   * In persistent mode, this assigns queued jobs to idle workers in the pool.
   */
  process_queue() {
    if (this.shutting_down) {
      return;
    }
    if (this.type === "persistent") {
      this.ensure_persistent_pool();
      for (const node_worker of this.persistent_pool) {
        if (this.job_queue.length === 0) {
          break;
        }
        const state = this.persistent_job_map.get(node_worker);
        if (state && !state.settled) {
          continue;
        }
        const job = this.job_queue.shift();
        if (job.signal && job.signal.aborted) {
          const error = new Worker.Error("Worker job aborted", this.worker_path);
          job.reject(error);
          continue;
        }
        this.assign_job_to_persistent_worker(node_worker, job);
      }
    } else {
      while (this.active_jobs < this.max_concurrency && this.job_queue.length > 0 && !this.shutting_down) {
        const job = this.job_queue.shift();
        if (job.signal && job.signal.aborted) {
          const error = new Worker.Error("Worker job aborted", this.worker_path);
          job.reject(error);
          continue;
        }
        this.spawn_worker_for_job(job);
      }
    }
  }
  /**
   * Ensure that the persistent worker pool is fully initialized
   * up to worker_count.
   */
  ensure_persistent_pool() {
    while (this.persistent_pool.length < this.workers_count) {
      const node_worker = new import_worker_threads.Worker(this.worker_path, {
        workerData: this.worker_data
      });
      this.persistent_pool.push(node_worker);
      this.persistent_job_map.set(node_worker, null);
      this.attach_persistent_event_handlers(node_worker);
    }
  }
  /**
   * Attach event handlers to a persistent worker thread for message,
   * error, and exit events.
   *
   * @param node_worker The worker thread to attach handlers to.
   */
  attach_persistent_event_handlers(node_worker) {
    node_worker.on("message", (raw_message) => {
      const state = this.persistent_job_map.get(node_worker);
      if (!state || state.settled) {
        return;
      }
      const message = raw_message;
      if (!message || typeof message !== "object") {
        const error = new Worker.Error("Worker returned an invalid message", this.worker_path);
        state.job.reject(error);
        this.handle_persistent_worker_failure(node_worker, "invalid-message");
        return;
      }
      if (message.ok) {
        state.job.resolve(message.result);
        this.handle_persistent_worker_completion(node_worker, state);
      } else {
        const worker_error = message.error;
        const error_message = worker_error?.message ?? "Worker job failed with an unknown error";
        const wrapped_error = new Worker.Error(error_message, this.worker_path, worker_error);
        state.job.reject(wrapped_error);
        this.handle_persistent_worker_completion(node_worker, state);
      }
    });
    node_worker.on("error", (err) => {
      const state = this.persistent_job_map.get(node_worker);
      const worker_error = {
        name: err.name,
        message: err.message,
        stack: err.stack
      };
      const wrapped_error = new Worker.Error(`Worker thread error: ${err.message}`, this.worker_path, worker_error);
      if (state && !state.settled) {
        state.job.reject(wrapped_error);
      }
      this.handle_persistent_worker_failure(node_worker, "error");
    });
    node_worker.on("exit", (code) => {
      if (!this.persistent_pool.includes(node_worker)) {
        return;
      }
      const state = this.persistent_job_map.get(node_worker);
      if (state && !state.settled) {
        const error = new Worker.Error(`Worker exited unexpectedly with code ${code}`, this.worker_path);
        state.job.reject(error);
      }
      this.handle_persistent_worker_failure(node_worker, "exit");
    });
  }
  /**
   * Assign a job to a specific persistent worker and set up timeout
   * and abort handling for that job.
   *
   * @param node_worker The worker thread that will run the job.
   * @param job The job to execute.
   */
  assign_job_to_persistent_worker(node_worker, job) {
    this.active_jobs += 1;
    const effective_timeout = job.timeout ?? this.default_timeout;
    const state = {
      job,
      settled: false,
      timeout_handle: void 0,
      abort_listener: void 0
    };
    if (effective_timeout > 0) {
      state.timeout_handle = setTimeout(() => {
        if (state.settled) {
          return;
        }
        state.settled = true;
        const error = new Worker.Error(`Worker job timed out after ${effective_timeout}ms`, this.worker_path);
        state.job.reject(error);
        this.handle_persistent_worker_failure(node_worker, "timeout");
      }, effective_timeout);
    }
    if (job.signal) {
      if (job.signal.aborted) {
        if (state.timeout_handle) {
          clearTimeout(state.timeout_handle);
        }
        const error = new Worker.Error("Worker job aborted", this.worker_path);
        job.reject(error);
        this.active_jobs -= 1;
        this.process_queue();
        return;
      }
      const abort_listener = () => {
        if (state.settled) {
          return;
        }
        state.settled = true;
        const error = new Worker.Error("Worker job aborted", this.worker_path);
        state.job.reject(error);
        this.handle_persistent_worker_failure(node_worker, "abort");
      };
      job.signal.addEventListener("abort", abort_listener);
      state.abort_listener = abort_listener;
    }
    this.persistent_job_map.set(node_worker, state);
    const request = {
      payload: job.payload
    };
    node_worker.postMessage(request);
  }
  /**
   * Clean up timers and listeners for a completed or failed job
   * running on a persistent worker.
   *
   * @param node_worker The worker that was running the job.
   * @param state The job state associated with this worker.
   */
  cleanup_persistent_job_state(node_worker, state) {
    if (state.timeout_handle) {
      clearTimeout(state.timeout_handle);
      state.timeout_handle = void 0;
    }
    if (state.abort_listener && state.job.signal) {
      state.job.signal.removeEventListener("abort", state.abort_listener);
      state.abort_listener = void 0;
    }
    state.settled = true;
    this.persistent_job_map.set(node_worker, null);
    this.active_jobs -= 1;
  }
  /**
   * Handle a normal job completion on a persistent worker and trigger
   * processing of additional queued jobs.
   *
   * @param node_worker The worker that completed the job.
   * @param state The job state associated with this worker.
   */
  handle_persistent_worker_completion(node_worker, state) {
    if (state.settled) {
      return;
    }
    this.cleanup_persistent_job_state(node_worker, state);
    this.process_queue();
  }
  /**
   * Handle a persistent worker failure (timeout, abort, error, invalid message, exit).
   *
   * This will:
   * - Clean up any active job state.
   * - Remove the worker from the pool.
   * - Terminate the worker (best-effort).
   * - Recreate the worker if the pool is not shutting down.
   *
   * @param node_worker The failed worker thread.
   * @param reason Short reason string for internal categorization.
   */
  handle_persistent_worker_failure(node_worker, reason) {
    const state = this.persistent_job_map.get(node_worker);
    if (state && !state.settled) {
      this.cleanup_persistent_job_state(node_worker, state);
    }
    this.remove_persistent_worker(node_worker);
    node_worker.terminate().catch(() => {
    });
    if (!this.shutting_down) {
      this.ensure_persistent_pool();
      this.process_queue();
    }
  }
  /**
   * Remove a worker from the persistent pool and clear its job mapping.
   *
   * @param node_worker The worker to remove.
   */
  remove_persistent_worker(node_worker) {
    const index = this.persistent_pool.indexOf(node_worker);
    if (index >= 0) {
      this.persistent_pool.splice(index, 1);
    }
    this.persistent_job_map.delete(node_worker);
  }
  /**
   * Internal helper to create a new Node worker thread for a single job
   * in ephemeral mode and wire up all lifecycle and timeout handling.
   *
   * @param job Job to execute in the worker thread.
   */
  spawn_worker_for_job(job) {
    this.active_jobs += 1;
    const node_worker = new import_worker_threads.Worker(this.worker_path, {
      workerData: this.worker_data
    });
    this.ephemeral_workers.add(node_worker);
    let settled = false;
    let timeout_handle;
    let abort_listener;
    const cleanup = () => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeout_handle) {
        clearTimeout(timeout_handle);
        timeout_handle = void 0;
      }
      if (job.signal && abort_listener) {
        job.signal.removeEventListener("abort", abort_listener);
        abort_listener = void 0;
      }
      this.active_jobs -= 1;
      this.ephemeral_workers.delete(node_worker);
      node_worker.terminate().catch(() => {
      });
      this.process_queue();
    };
    const effective_timeout = job.timeout ?? this.default_timeout;
    if (effective_timeout > 0) {
      timeout_handle = setTimeout(() => {
        if (settled) {
          return;
        }
        const error = new Worker.Error(`Worker job timed out after ${effective_timeout}ms`, this.worker_path);
        job.reject(error);
        cleanup();
      }, effective_timeout);
    }
    if (job.signal) {
      if (job.signal.aborted) {
        const error = new Worker.Error("Worker job aborted", this.worker_path);
        job.reject(error);
        cleanup();
        return;
      }
      abort_listener = () => {
        if (settled) {
          return;
        }
        const error = new Worker.Error("Worker job aborted", this.worker_path);
        job.reject(error);
        cleanup();
      };
      job.signal.addEventListener("abort", abort_listener);
    }
    node_worker.once("message", (raw_message) => {
      if (settled) {
        return;
      }
      const message = raw_message;
      if (!message || typeof message !== "object") {
        const error = new Worker.Error("Worker returned an invalid message", this.worker_path);
        job.reject(error);
        cleanup();
        return;
      }
      if (message.ok) {
        job.resolve(message.result);
      } else {
        const worker_error = message.error;
        const error_message = worker_error?.message ?? "Worker job failed with an unknown error";
        const error = new Worker.Error(error_message, this.worker_path, worker_error);
        job.reject(error);
      }
      cleanup();
    });
    node_worker.once("error", (err) => {
      if (settled) {
        return;
      }
      const worker_error = {
        name: err.name,
        message: err.message,
        stack: err.stack
      };
      const error = new Worker.Error(`Worker thread error: ${err.message}`, this.worker_path, worker_error);
      job.reject(error);
      cleanup();
    });
    node_worker.once("exit", (code) => {
      if (settled) {
        return;
      }
      const error = new Worker.Error(`Worker exited unexpectedly with code ${code}`, this.worker_path);
      job.reject(error);
      cleanup();
    });
    const request = {
      payload: job.payload
    };
    node_worker.postMessage(request);
  }
}
(function(Worker2) {
  class Error2 extends globalThis.Error {
    /** Path to the worker module that failed. */
    worker_path;
    /** Serialized error information from inside the worker, if available. */
    worker_error;
    /**
     * Create a new worker error.
     *
     * @param message Human-readable error message.
     * @param worker_path Path to the worker module.
     * @param worker_error Serialized error from inside the worker, if any.
     */
    constructor(message, worker_path, worker_error) {
      super(message);
      this.name = "WorkerError";
      this.worker_path = worker_path;
      this.worker_error = worker_error;
    }
  }
  Worker2.Error = Error2;
  class TimeoutError extends Worker2.Error {
    /**
     * Create a new worker timeout error.
     *
     * @param message Human-readable error message.
     * @param worker_path Path to the worker module.
     * @param worker_error Serialized error from inside the worker, if any.
     */
    constructor(message, worker_path, worker_error) {
      super(message, worker_path, worker_error);
    }
  }
  Worker2.TimeoutError = TimeoutError;
  function start_worker_runtime(handler) {
    if (!import_worker_threads.parentPort) {
      throw new globalThis.Error("start_worker_runtime must be called from within a worker thread");
    }
    import_worker_threads.parentPort.on("message", async (raw_message) => {
      if (!import_worker_threads.parentPort) {
        throw new globalThis.Error("start_worker_runtime must be called from within a worker thread");
      }
      const message = raw_message;
      try {
        const result = await handler(message.payload);
        const response = {
          ok: true,
          result
        };
        import_worker_threads.parentPort.postMessage(response);
      } catch (err) {
        const any_error = err;
        const serialized = {
          name: any_error?.name ?? "Error",
          message: any_error?.message ?? "Unknown error",
          stack: any_error?.stack
        };
        try {
          const { name, message: message2, stack, ...rest } = any_error ?? {};
          if (rest && Object.keys(rest).length > 0) {
            serialized.details = rest;
          }
        } catch {
        }
        const response = {
          ok: false,
          error: serialized
        };
        import_worker_threads.parentPort.postMessage(response);
      }
    });
  }
  Worker2.start_worker_runtime = start_worker_runtime;
  function resolve_worker_path(relative_path, module_url) {
    return (0, import_url.fileURLToPath)(new URL(relative_path, module_url));
  }
  Worker2.resolve_worker_path = resolve_worker_path;
  function is_worker_thread() {
    return import_worker_threads.parentPort != null;
  }
  Worker2.is_worker_thread = is_worker_thread;
  function is_main_thread() {
    return !is_worker_thread();
  }
  Worker2.is_main_thread = is_main_thread;
})(Worker || (Worker = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Worker
});
