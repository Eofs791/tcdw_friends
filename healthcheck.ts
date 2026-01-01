import { parse } from "smol-toml";

interface FriendItem {
  name: string;
  url: string;
  avatar: string;
  description?: string;
  hidden?: boolean;
}

interface FriendsData {
  blogs: FriendItem[];
  nonBlogs: FriendItem[];
}

interface CheckResult {
  name: string;
  url: string;
  status: "ok" | "error" | "redirect" | "timeout";
  statusCode?: number;
  redirectUrl?: string;
  error?: string;
  responseTime?: number;
}

const TIMEOUT_MS = 10000;

async function checkUrl(item: FriendItem): Promise<CheckResult> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(item.url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FriendsHealthCheck/1.0)",
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get("location") || "";
      return {
        name: item.name,
        url: item.url,
        status: "redirect",
        statusCode: response.status,
        redirectUrl,
        responseTime,
      };
    }

    if (response.status !== 200) {
      return {
        name: item.name,
        url: item.url,
        status: "error",
        statusCode: response.status,
        responseTime,
      };
    }

    return {
      name: item.name,
      url: item.url,
      status: "ok",
      statusCode: response.status,
      responseTime,
    };
  } catch (err) {
    const responseTime = Date.now() - startTime;

    if (err instanceof Error && err.name === "AbortError") {
      return {
        name: item.name,
        url: item.url,
        status: "timeout",
        error: `Timeout after ${TIMEOUT_MS}ms`,
        responseTime,
      };
    }

    return {
      name: item.name,
      url: item.url,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      responseTime,
    };
  }
}

function formatResult(result: CheckResult): string {
  const timeStr = result.responseTime ? ` (${result.responseTime}ms)` : "";

  switch (result.status) {
    case "ok":
      return `✅ ${result.name}: OK${timeStr}`;
    case "timeout":
      return `⏱️  ${result.name}: TIMEOUT${timeStr}`;
    case "redirect":
      return `🔀 ${result.name}: ${result.statusCode} -> ${result.redirectUrl}${timeStr}`;
    case "error":
      if (result.statusCode) {
        return `❌ ${result.name}: HTTP ${result.statusCode}${timeStr}`;
      }
      return `❌ ${result.name}: ${result.error}${timeStr}`;
  }
}

async function main(): Promise<void> {
  const tomlContent = await Bun.file("./friends.toml").text();
  const data = parse(tomlContent) as unknown as FriendsData;

  const allItems = [...data.blogs, ...data.nonBlogs].filter(
    (item) => !item.hidden
  );

  console.log(`Checking ${allItems.length} sites...\n`);

  const results: CheckResult[] = [];

  // Check in batches of 5 to avoid overwhelming
  const batchSize = 5;
  for (let i = 0; i < allItems.length; i += batchSize) {
    const batch = allItems.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(checkUrl));

    for (const result of batchResults) {
      results.push(result);
      console.log(formatResult(result));
    }
  }

  // Summary
  const ok = results.filter((r) => r.status === "ok").length;
  const errors = results.filter((r) => r.status === "error").length;
  const timeouts = results.filter((r) => r.status === "timeout").length;
  const redirects = results.filter((r) => r.status === "redirect").length;

  console.log("\n--- Summary ---");
  console.log(`✅ OK: ${ok}`);
  console.log(`🔀 Redirects: ${redirects}`);
  console.log(`⏱️  Timeouts: ${timeouts}`);
  console.log(`❌ Errors: ${errors}`);

  if (errors > 0 || timeouts > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
