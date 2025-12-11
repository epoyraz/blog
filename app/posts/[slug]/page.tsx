import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { renderMarkdownToHtml } from "@/lib/markdown";

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  if (!slug) notFound();

  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }

  const { meta, content } = post;
  const normalized = normalizeContent(meta.title, meta.date, content);
  const html = renderMarkdownToHtml(normalized);

  return (
    <main>
      <div className="mb-[2ch] text-left" style={{ textTransform: "none" }}>
        {formatDateLong(meta.date)}
      </div>
      <div className="heading">{meta.title}</div>
      <hr className="border-black" />

      <article>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </main>
  );
}

function formatDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleDateString("en-GB");
}

function formatDateLong(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeContent(title: string, dateIso: string, raw: string) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  while (i < lines.length && lines[i].trim() === "") i++;

  const dateVariants = new Set<string>();
  dateVariants.add(formatDate(dateIso));
  const d = new Date(dateIso);
  if (!Number.isNaN(d.getTime())) {
    dateVariants.add(
      d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    );
    dateVariants.add(
      d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    );
  }

  if (i < lines.length && dateVariants.has(lines[i].trim())) i++;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i < lines.length && lines[i].trim() === title.trim()) i++;
  while (i < lines.length && lines[i].trim() === "") i++;

  return lines.slice(i).join("\n").trimStart();
}
