/**
 * Google Forms extraction and submission.
 *
 * Approach (matches common programmatic submission pattern):
 * - Submit to formResponse endpoint: .../forms/d/e/<FORM_ID>/formResponse
 * - Send entry.<ID>=value as form-encoded params (POST or GET)
 * - Include submit=Submit parameter
 * - Entry IDs: extracted from FB_PUBLIC_LOAD_DATA_ in viewform HTML
 *
 * Structure (from https://github.com/tienthanh214/googleform-autofill-and-submit):
 * - data[1][1] = form entries array
 * - Each entry: [containerId, name, ?, type, [subEntries]]
 * - Grid (type 7): subEntries = array of rows, each row = [entryId, options, required, rowLabel]
 * - Single-entry: subEntries[0] = [entryId, options, required]
 * - Type 8 = page/section (skip)
 */
import { log } from './logging'

export interface FormQuestion {
  entryId: string;
  prompt: string;
  type: number;
  typeName: string;
  options?: string[];
  required?: boolean;
  /** For grid (type 7): one entry per row - each row has its own entryId */
  gridRows?: { entryId: string; rowLabel: string; options?: string[] }[];
}

export interface ExtractedForm {
  formId: string;
  formUrl: string;
  /** URL to use for submit_google_form - prefer this over formUrl when available (works for /d/ inputs) */
  formResponseUrl?: string;
  title?: string;
  description?: string;
  questions: FormQuestion[];
}

const QUESTION_TYPES: Record<number, string> = {
  0: "short_answer",
  1: "paragraph",
  2: "multiple_choice",
  3: "dropdown",
  4: "checkbox",
  5: "linear_scale",
  7: "grid",
  8: "page_section", // Skip - not a question
  9: "date",
  10: "time",
};

function extractFormIdFromUrl(url: string): string | null {
  let toCheck = url.trim();
  const urlMatch = toCheck.match(/https?:\/\/[^\s<>"']+/);
  if (urlMatch) toCheck = urlMatch[0];
  const match = toCheck.match(/\/forms\/d\/(?:e\/)?([^/?\s]+)/);
  return match ? match[1].trim() : null;
}

/**
 * Resolve shortened URL (forms.gle) to full URL by following redirect.
 * Returns the resolved URL after following redirects.
 * Uses curl subprocess for reliable redirect handling.
 */
async function resolveShortUrl(url: string): Promise<string> {
  try {
    // Dynamically import for Node.js server-side only
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execPromise = promisify(exec);

    // Use curl to follow redirects reliably
    const { stdout } = await execPromise(
      `curl -sL "${url.replace(/"/g, '\\"')}" -w "%{url_effective}" -o /dev/null`,
      { timeout: 10000 } // 10 second timeout
    );

    return stdout.trim();
  } catch (err) {
    throw new Error(`Failed to resolve shortened URL: ${err}`);
  }
}

async function getViewformUrl(url: string): Promise<string> {
  let toCheck = url.trim();
  const urlMatch = toCheck.match(/https?:\/\/[^\s<>"']+/);
  if (urlMatch) toCheck = urlMatch[0];

  // Handle shortened URLs (forms.gle)
  if (/forms\.gle/.test(toCheck)) {
    toCheck = await resolveShortUrl(toCheck);
  }

  const formId = extractFormIdFromUrl(toCheck);
  if (!formId) throw new Error("Invalid Google Form URL: could not extract form ID");
  const hasShortFormat = /\/forms\/d\/e\//.test(toCheck);
  return hasShortFormat
    ? `https://docs.google.com/forms/d/e/${formId}/viewform`
    : `https://docs.google.com/forms/d/${formId}/viewform`;
}

const formResponseUrlCache = new Map<string, string>();

/**
 * Extract formResponse URL from FB_PUBLIC_LOAD_DATA_ in the form HTML.
 * Index [14] contains the form path (e.g. "e/1FAIpQL...") used for submission.
 * This works for both /d/ and /e/ URLs since the HTML always has the correct ID.
 */
function extractFormResponseUrlFromData(data: unknown): string | null {
  if (!Array.isArray(data) || data.length < 15) return null;
  const path = data[14];
  if (typeof path !== "string" || !path.startsWith("e/")) return null;
  return `https://docs.google.com/forms/d/${path}/formResponse`;
}

/**
 * Resolve form URL to the formResponse endpoint.
 * For /d/ URLs: fetches viewform HTML and extracts submission URL from FB_PUBLIC_LOAD_DATA_[14].
 * For /e/ URLs: uses directly (formResponse only accepts /e/ format).
 */
async function resolveFormResponseUrl(formUrl: string): Promise<string> {
  let toCheck = formUrl.trim();
  const urlMatch = toCheck.match(/https?:\/\/[^\s<>"']+/);
  if (urlMatch) toCheck = urlMatch[0];

  // Already in /e/ format - use directly
  if (/\/forms\/d\/e\//.test(toCheck)) {
    const formId = extractFormIdFromUrl(toCheck);
    if (!formId) throw new Error("Invalid Google Form URL: could not extract form ID");
    return `https://docs.google.com/forms/d/e/${formId}/formResponse`;
  }

  // Check cache (avoids refetch when submitting multiple personas)
  const cached = formResponseUrlCache.get(toCheck);
  if (cached) return cached;

  // /d/ format - fetch HTML and extract formResponse URL from FB_PUBLIC_LOAD_DATA_[14]
  const viewformUrl = await getViewformUrl(formUrl);
  const res = await fetch(viewformUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch form: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();

  // Detect "Page Not Found" - form may be private or URL wrong
  if (/does not exist|Page Not Found|requested does not exist/i.test(html)) {
    log.warn("google_form.form_not_found", "Form returned Page Not Found - ensure form is shared (Anyone with link) and URL is correct", {
      sourceFile: "google-forms.ts",
      sourceLine: 108,
      metadata: { viewformUrl },
    });
  }

  // Try 1: Extract from FB_PUBLIC_LOAD_DATA_[14] (form path like "e/1FAIpQL...")
  const dataMatch = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*([\s\S]+?);/);
  if (dataMatch) {
    try {
      const data = JSON.parse(dataMatch[1]);
      const resolvedUrl = extractFormResponseUrlFromData(data);
      if (resolvedUrl) {
        formResponseUrlCache.set(toCheck, resolvedUrl);
        log.info("google_form.url_resolved", "Extracted formResponse URL from FB_PUBLIC_LOAD_DATA_", {
          sourceFile: "google-forms.ts",
          sourceLine: 115,
          metadata: { path: (data as unknown[])[14]?.toString().substring(0, 30) + "..." },
        });
        return resolvedUrl;
      }
    } catch {
      // Parse failed, try fallback
    }
  }

  // Try 2: Extract form action URL from HTML
  const actionMatch = html.match(/action="(https:\/\/docs\.google\.com\/forms\/d\/e\/[^"]+formResponse)"/);
  if (actionMatch) {
    const resolvedUrl = actionMatch[1];
    formResponseUrlCache.set(toCheck, resolvedUrl);
    log.info("google_form.url_resolved", "Extracted formResponse URL from form action", {
      sourceFile: "google-forms.ts",
      sourceLine: 128,
      metadata: { url: resolvedUrl.substring(0, 60) + "..." },
    });
    return resolvedUrl;
  }

  // Try 3: Find "e/1FAIpQL..." path in FB_PUBLIC_LOAD_DATA_ (index may vary)
  const pathMatch = html.match(/"e\/1FAIpQL[A-Za-z0-9_-]+"/);
  if (pathMatch) {
    const path = pathMatch[0].slice(1, -1); // Remove quotes
    const resolvedUrl = `https://docs.google.com/forms/d/${path}/formResponse`;
    formResponseUrlCache.set(toCheck, resolvedUrl);
    log.info("google_form.url_resolved", "Extracted formResponse URL from path pattern", {
      sourceFile: "google-forms.ts",
      sourceLine: 140,
      metadata: { path: path.substring(0, 30) + "..." },
    });
    return resolvedUrl;
  }

  // Fallback: try /d/ID/formResponse (may return 400 - do not cache)
  log.warn("google_form.resolve_fallback", "Could not extract form path, using /d/ URL (may fail)", {
    sourceFile: "google-forms.ts",
    sourceLine: 155,
    metadata: { viewformUrl },
  });
  const formId = extractFormIdFromUrl(toCheck);
  return `https://docs.google.com/forms/d/${formId}/formResponse`;
}

function parseOptions(optionData: unknown): string[] {
  if (!Array.isArray(optionData)) return [];
  const options: string[] = [];
  for (const item of optionData) {
    if (Array.isArray(item) && typeof item[0] === 'string' && item[0].trim()) {
      options.push(item[0]);
    }
  }
  return options;
}

function extractQuestionsFromData(data: unknown): FormQuestion[] {
  const questions: FormQuestion[] = [];
  if (!Array.isArray(data)) return questions;

  let fieldsArray: unknown[] = [];
  if (Array.isArray(data[1]) && Array.isArray(data[1][1])) {
    fieldsArray = data[1][1];
  } else if (Array.isArray(data[1])) {
    fieldsArray = data[1];
  }

  for (const field of fieldsArray) {
    if (!Array.isArray(field)) continue;
    const type = typeof field[3] === "number" ? field[3] : 0;
    // Skip page/section (type 8) - not a question
    if (type === 8) continue;

    const questionText = field[1];
    if (typeof questionText !== "string") continue;

    const typeName = QUESTION_TYPES[type] ?? "unknown";

    let entryId: string | null = null;
    let options: string[] | undefined;
    let gridRows: { entryId: string; rowLabel: string; options?: string[] }[] | undefined;

    if (!Array.isArray(field[4])) continue;

    // Grid (type 7): field[4] is array of rows. Each row: [entryId, options, 0, rowLabel]
    // See: https://github.com/tienthanh214/googleform-autofill-and-submit
    if (type === 7) {
      gridRows = [];
      for (const row of field[4]) {
        if (!Array.isArray(row)) continue;
        const rowEntryId = typeof row[0] === "number" ? String(row[0]) : null;
        const rowLabel = Array.isArray(row[3])
          ? (row[3][0] ?? "")
          : typeof row[3] === "string"
            ? row[3]
            : "";
        if (rowEntryId) {
          gridRows.push({
            entryId: rowEntryId,
            rowLabel: String(rowLabel),
            options: Array.isArray(row[1]) ? parseOptions(row[1]) : undefined,
          });
        }
      }
      entryId = gridRows[0]?.entryId ?? null;
    } else {
      // Single-entry: field[4][0] = [entryId, options, required] or similar
      const sub = field[4][0];
      if (Array.isArray(sub) && typeof sub[0] === "number") {
        entryId = String(sub[0]);
        if (Array.isArray(sub[1])) options = parseOptions(sub[1]);
      } else if (typeof sub === "number") {
        entryId = String(sub);
      }
    }

    if (!entryId && !gridRows?.length) continue;

    const required = Array.isArray(field[4][0]) && field[4][0][2] === 1;
    questions.push({
      entryId: entryId ?? gridRows![0].entryId,
      prompt: questionText,
      type,
      typeName,
      options: options?.length ? options : undefined,
      required,
      gridRows: gridRows?.length ? gridRows : undefined,
    });
  }

  return questions;
}

/**
 * Extract form structure from a Google Forms URL.
 * Fetches the HTML and parses FB_PUBLIC_LOAD_DATA_.
 */
export async function extractGoogleForm(formUrl: string): Promise<ExtractedForm> {
  // Resolve shortened URLs first
  let resolvedUrl = formUrl;
  if (/forms\.gle/.test(formUrl)) {
    resolvedUrl = await resolveShortUrl(formUrl);
  }

  const formId = extractFormIdFromUrl(resolvedUrl);
  if (!formId) {
    throw new Error("Invalid Google Form URL: could not extract form ID");
  }

  const fetchUrl = await getViewformUrl(formUrl);
  const res = await fetch(fetchUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch form: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const match = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*([\s\S]+?);/);
  if (!match) {
    throw new Error("Form structure not found (FB_PUBLIC_LOAD_DATA_ missing)");
  }

  let data: unknown;
  try {
    data = JSON.parse(match[1]);
  } catch {
    throw new Error("Failed to parse form data");
  }

  const questions = extractQuestionsFromData(data);
  if (questions.length === 0) {
    throw new Error("No questions found in form");
  }

  let title: string | undefined;
  let description: string | undefined;
  const d = data as unknown[];
  if (Array.isArray(d[1])) {
    const d1 = d[1] as unknown[];
    description = typeof d1[0] === "string" ? d1[0] : undefined;
    title = typeof d1[8] === "string" ? d1[8] : undefined;
  }

  // Extract submission URL for submit_google_form (critical for /d/ URLs)
  let formResponseUrl: string | undefined = extractFormResponseUrlFromData(data) ?? undefined;
  if (!formResponseUrl) {
    const actionMatch = html.match(/action="(https:\/\/docs\.google\.com\/forms\/d\/e\/[^"]+formResponse)"/);
    formResponseUrl = actionMatch ? actionMatch[1] : undefined;
  }
  if (!formResponseUrl) {
    const pathMatch = html.match(/"e\/1FAIpQL[A-Za-z0-9_-]+"/);
    if (pathMatch) {
      const path = pathMatch[0].slice(1, -1);
      formResponseUrl = `https://docs.google.com/forms/d/${path}/formResponse`;
    }
  }

  return {
    formId,
    formUrl: fetchUrl,
    formResponseUrl,
    title,
    description,
    questions,
  };
}

/**
 * Submit responses to a Google Form via HTTP POST.
 * Works for most forms. Fails gracefully if CAPTCHA/email validation required.
 */
export async function submitGoogleForm(
  formUrl: string,
  responses: Record<string, string | string[]>,
  formQuestions?: { entryId: string; gridRows?: { entryId: string }[] }[]
): Promise<{ success: boolean; submitted: number; error?: string }> {
  let toCheck = formUrl.trim();
  const urlMatch = toCheck.match(/https?:\/\/[^\s<>"']+/);
  if (urlMatch) toCheck = urlMatch[0];

  const formId = extractFormIdFromUrl(toCheck);
  if (!formId) {
    throw new Error("Invalid Google Form URL: could not extract form ID");
  }

  // Resolve formResponse URL
  const submitUrl = await resolveFormResponseUrl(toCheck);

  // Fill missing grid rows with "3" - LLM often omits them
  let merged = { ...responses };
  if (formQuestions) {
    for (const q of formQuestions) {
      if (q.gridRows) {
        for (const row of q.gridRows) {
          if (!(row.entryId in merged)) {
            merged[row.entryId] = "3";
            log.info("google_form.fill_grid_default", `Filled missing grid row ${row.entryId} with "3"`, {
              sourceFile: "google-forms.ts",
              sourceLine: 370,
              metadata: { entryId: row.entryId },
            });
          }
        }
      }
    }
  }

  const params = new URLSearchParams();

  const normalizeOptionValue = (v: string): string => {
    // "45-54" -> "45 - 54" (form options often have spaces around hyphen)
    const rangeMatch = v.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) return `${rangeMatch[1]} - ${rangeMatch[2]}`;
    return v;
  };

  for (const [entryId, value] of Object.entries(merged)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        params.append(`entry.${entryId}`, normalizeOptionValue(String(v)));
      }
    } else {
      params.append(`entry.${entryId}`, normalizeOptionValue(String(value)));
    }
  }
  params.append("submit", "Submit");

  const body = params.toString();
  const startMs = Date.now();

  log.info("google_form.submit_start", "Submitting to Google Form via HTTP POST", {
    sourceFile: "google-forms.ts",
    sourceLine: 405,
    metadata: {
      formId: formId.substring(0, 20) + "...",
      submitUrl: submitUrl.substring(0, 70) + "...",
      entryCount: Object.keys(responses).length,
    },
  });

  const viewformUrl = submitUrl.replace("/formResponse", "/viewform");
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Referer: viewformUrl,
  };

  let res = await fetch(submitUrl, {
    method: "POST",
    headers,
    body,
    redirect: "manual",
  });

  // Some forms accept GET but reject POST with 400 - try GET as fallback
  if (res.status === 400) {
    const getUrl = `${submitUrl}${submitUrl.includes("?") ? "&" : "?"}${body}`;
    log.info("google_form.try_get", "POST returned 400, retrying with GET", {
      sourceFile: "google-forms.ts",
      sourceLine: 435,
      metadata: { submitUrl: submitUrl.substring(0, 60) + "..." },
    });
    res = await fetch(getUrl, {
      method: "GET",
      headers: {
        "User-Agent": headers["User-Agent"],
        Referer: viewformUrl,
      },
      redirect: "manual",
    });
  }

  const durationMs = Date.now() - startMs;
  const submitted = Object.keys(merged).length;

  // Google Forms: 302 = success (redirect). Some forms return 200 on success.
  const success = res.status === 302 || res.status === 200;
  let errorMsg: string | undefined;

  if (!success) {
    const bodySnippet = (await res.text()).slice(0, 300);
    const hint =
      res.status === 400
        ? " Form may require CAPTCHA or email verification. Disable 'Send responders a copy' in form settings if possible. Ensure option values match exactly."
        : "";
    errorMsg = `HTTP ${res.status} (expected 302 for success).${hint}`;
    if (res.status === 400) {
      formResponseUrlCache.delete(toCheck);
    }

    log.error("google_form.submit_failed", "Google Form submission failed", {
      sourceFile: "google-forms.ts",
      sourceLine: 465,
      metadata: {
        formId: formId.substring(0, 20) + "...",
        status: res.status,
        durationMs,
        hint: res.status === 400 ? "CAPTCHA or validation error" : "",
      },
    });
  } else {
    log.info("google_form.submit_success", "Google Form submission succeeded", {
      sourceFile: "google-forms.ts",
      sourceLine: 476,
      metadata: {
        formId: formId.substring(0, 20) + "...",
        submitted,
        durationMs,
      },
    });
  }

  return { success, submitted, error: errorMsg };
}

