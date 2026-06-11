import { createServerSupabase } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReportButton from "./ReportButton";
import ImageLightbox from "./ImageLightbox";
import CloseButton from "./CloseButton";
import { DEMO_ACCOUNT_IDS } from "@/lib/demo"

export default async function PostDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (!post) notFound();

  let signedPhotoUrl: string | null = null;
  if (post?.photo_url) {
    const { data: signed } = await supabase.storage
      .from("post-images")
      .createSignedUrl(post.photo_url, 3600);
    signedPhotoUrl = signed?.signedUrl ?? null;
  }

  const { data: { user } } = await supabase.auth.getUser();
  const isDemo = user ? DEMO_ACCOUNT_IDS.has(user.id) : false;
  const isResolved = post.status === "resolved";

  return (
    <main
      style={{ background: "#080c18", minHeight: "100vh" }}
      className="px-4 py-8"
    >
      <div className="max-w-xl mx-auto relative">
        <CloseButton />

        {isResolved && (
          <div
            className="rounded-xl p-4 mb-4 text-center"
            style={{ background: "#14301f", border: "1px solid #14532d" }}
          >
            <p className="text-sm font-semibold" style={{ color: "#4ade80" }}>
              ✓ This item has been returned to its owner
            </p>
          </div>
        )}

        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#0d1225",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {signedPhotoUrl && (
            <ImageLightbox src={signedPhotoUrl} alt={post.title} />
          )}

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={
                  post.type === "lost"
                    ? {
                        background: "#3d1515",
                        color: "#f87171",
                        border: "1px solid #7f1d1d",
                      }
                    : {
                        background: "#14301f",
                        color: "#4ade80",
                        border: "1px solid #14532d",
                      }
                }
              >
                {post.type}
              </span>
              <span className="text-sm" style={{ color: "#8b92a5" }}>
                {new Date(post.created_at).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>

            <h1
              className="text-2xl font-bold leading-snug"
              style={{ color: "#f0f2f5" }}
            >
              {post.title}
            </h1>

            <div className="flex items-center gap-3 mt-2">
              <p className="text-sm" style={{ color: "#8b92a5" }}>
                📍 {post.location}
              </p>
              {post.category && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "#8b92a5",
                  }}
                >
                  {post.category}
                </span>
              )}
            </div>

            {post.description && (
              <p
                className="mt-4 text-sm leading-relaxed"
                style={{ color: "#8b92a5" }}
              >
                {post.description}
              </p>
            )}

            {post.verification_question &&
              !isResolved &&
              post.type !== "lost" && (
                <div
                  className="mt-6 rounded-xl p-4"
                  style={{
                    background: "#111830",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: "#4a5068" }}
                  >
                    To claim, answer this:
                  </p>
                  <p className="text-sm" style={{ color: "#f0f2f5" }}>
                    {post.verification_question}
                  </p>
                </div>
              )}

            {!isResolved && (
              <>
                <div
                  className="rounded-xl p-3 mt-4"
                  style={{
                    background: "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.2)",
                  }}
                >
                  <p className="text-xs" style={{ color: "#fbbf24" }}>
                    ⚠️ Never pay anyone to return your item. Vaapsi handoffs are always free.
                  </p>
                </div>
                {isDemo ? (
                  <Link href="/signup">
                    <button
                      className="mt-4 w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                      style={{ background: "rgba(24,95,165,0.15)", color: "#5b9bd5", border: "1px solid rgba(24,95,165,0.3)" }}
                    >
                      Create an account to {post.type === "lost" ? "report found items" : "claim this item"} →
                    </button>
                  </Link>
                ) : (
                  <Link href={`/posts/${id}/claim`}>
                    <button
                      className="mt-4 w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ background: "#185FA5" }}
                    >
                      {post.type === "lost" ? "I Found This Item" : "Claim This Item"}
                    </button>
                  </Link>
                )}
              </>
            )}

            <div className="flex justify-end mt-4">
              <ReportButton postId={id} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
