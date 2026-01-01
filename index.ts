import friends from "./friends.json";

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderFriendItem(item: FriendItem): string {
  return `  <li class="friends-item">
    <a target="_blank" href="${escapeHtml(item.url)}">
      <div class="friends-item__avatar">
        <img
          loading="lazy"
          src="${escapeHtml(item.avatar)}"
          alt="头像"
        />
      </div>
      <p class="friends-item__name">${escapeHtml(item.name)}</p>
      <aside class="friends-item__description">${item.description ? escapeHtml(item.description) : ""}</aside>
    </a>
  </li>`;
}

function renderSection(title: string, items: FriendItem[]): string {
  const visibleItems = items.filter((item) => !item.hidden);
  const listItems = visibleItems.map(renderFriendItem).join("\n");

  return `<h3 class="friends-title">${escapeHtml(title)}</h3>

<ul class="friends-grid">
${listItems}
</ul>`;
}

async function generateHtml(): Promise<string> {
  const data = friends as FriendsData;
  const footer = await Bun.file("./footer.html").text();

  const sections = [
    renderSection("博客", data.blogs),
    renderSection("非博客", data.nonBlogs),
  ];

  return sections.join("\n\n") + "\n" + footer;
}

async function deploy(): Promise<void> {
  const remotePath =
    "tcdw@tcdw.host.reall.bond:/home/tcdw/apps/SilverBlog/documents/page/f35ac53d-96ec-5300-b58d-4a0f1cf68a1b";
  const outputFile = "./dist/friends.html";

  // Upload via scp
  console.log("Uploading to server...");
  const scpProc = Bun.spawn(["scp", outputFile, remotePath], {
    stdout: "inherit",
    stderr: "inherit",
  });
  const scpExitCode = await scpProc.exited;

  if (scpExitCode !== 0) {
    throw new Error(`scp failed with exit code ${scpExitCode}`);
  }
  console.log("Upload complete!");

  // Clear cache
  console.log("Clearing cache...");
  const response = await fetch("https://www.tcdw.net/cache/", {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to clear cache: ${response.status} ${response.statusText}`);
  }
  console.log("Cache cleared!");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const html = await generateHtml();
  const outputFile = "./dist/friends.html";

  // Always write to dist folder
  await Bun.write(outputFile, html);
  console.log(`Written to ${outputFile}`);

  if (args.includes("--deploy")) {
    await deploy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
