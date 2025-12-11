import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function HomePage() {
  const posts = getAllPosts();

  return (
    <main>
      <div className="mt-4 text-center">
        <Link href="/" className="title no-underline">
          <b>MY BLOG</b>
        </Link>
        <hr className="my-2 border-black" />
        <div className="flex w-full justify-center gap-6 text-left">
          <a href="mailto:you@example.com" className="title">
            CONTACT
          </a>
          <Link href="/rss.xml" className="title">
            RSS
          </Link>
          <a href="#" className="title">
            DONATE
          </a>
        </div>
      </div>

      <div className="heading">My Blog</div>
      <hr className="border-black" />

      <p>
        This is my personal website. You can find here most of the code and
        ideas I came up with during my extra‑professional time.
      </p>

      <div className="heading">Articles</div>
      <hr className="border-black" />

      <p className="text-left">
        {posts.map((post) => (
          <span key={post.slug}>
            {formatDate(post.date)}:{" "}
            <Link href={`/posts/${post.slug}`}>{post.title}</Link>
            <br />
          </span>
        ))}
      </p>
    </main>
  );
}

function formatDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleDateString("en-GB");
}

