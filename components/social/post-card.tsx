import Link from "next/link";
import Image from "next/image";
import type { FeedPost } from "@/lib/queries/posts";
import { toImageUrls } from "@/lib/utils/media";
import { formatDateTime } from "@/lib/utils/format";
import { Avatar } from "@/components/ui/avatar";
import { Price } from "@/components/ui/price";
import { Card } from "@/components/ui/card";
import { LikeButton } from "@/components/social/like-button";

/** Carte de post pour le feed. Présentation ; le like est un îlot client. */
export function PostCard({ post }: { post: FeedPost }) {
  const media = toImageUrls(post.media);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Avatar src={post.author?.avatarUrl} name={post.author?.name} size={40} />
        <div>
          {post.author ? (
            <Link href={post.author.href} className="text-sm font-medium hover:underline">
              {post.author.name}
            </Link>
          ) : (
            <span className="text-sm font-medium">Utilisateur</span>
          )}
          <p className="text-xs text-muted">{formatDateTime(post.created_at)}</p>
        </div>
      </div>

      {post.content && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{post.content}</p>}

      {media.length > 0 && (
        <div className={`mt-3 grid gap-2 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {media.slice(0, 4).map((url) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-lg border border-border">
              <Image src={url} alt="" fill sizes="(max-width:640px) 50vw, 300px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {post.article && (
        <Link
          href={`/article/${post.article.id}`}
          className="mt-3 flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-surface-elevated"
        >
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-elevated">
            {toImageUrls(post.article.images)[0] && (
              <Image src={toImageUrls(post.article.images)[0]} alt="" fill sizes="56px" className="object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{post.article.title}</p>
            <Price amount={post.article.price} currency={post.article.currency} className="text-sm" />
          </div>
        </Link>
      )}

      <div className="mt-4 flex items-center gap-5">
        <LikeButton postId={post.id} initialLiked={post.viewerLiked} initialCount={post.likeCount} />
        <Link href={`/feed/${post.id}`} className="text-sm text-muted hover:text-foreground">
          💬 {post.commentCount}
        </Link>
      </div>
    </Card>
  );
}
