"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { avatarFallback, timeAgo, cn } from "@/lib/utils";
import {
  addCommentAction,
  deleteCommentAction,
  toggleCommentLikeAction,
} from "@/app/actions/social";

export interface CommentView {
  id: string;
  content: string;
  created_at: string;
  author: { id: string; full_name: string; avatar_url: string | null };
  likes: number;
  liked: boolean;
  replies: CommentView[];
}

interface Props {
  videoId: string;
  uploaderId: string;
  currentUser: { id: string; full_name: string; avatar_url: string | null } | null;
  initial: CommentView[];
}

export default function VideoComments({
  videoId,
  uploaderId,
  currentUser,
  initial,
}: Props) {
  const [comments, setComments] = useState<CommentView[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const total =
    comments.length + comments.reduce((s, c) => s + c.replies.length, 0);

  function makeComment(id: string, created_at: string, content: string): CommentView {
    return {
      id,
      content,
      created_at,
      author: currentUser!,
      likes: 0,
      liked: false,
      replies: [],
    };
  }

  async function addTop() {
    if (!currentUser) return;
    const content = text.trim();
    if (!content) return;
    setBusy(true);
    const res = await addCommentAction({ videoId, content });
    setBusy(false);
    if (res.error) return alert(res.error);
    setComments((prev) => [
      ...prev,
      makeComment(res.id!, res.created_at!, content),
    ]);
    setText("");
  }

  async function addReply(parentId: string, content: string) {
    if (!currentUser || !content.trim()) return;
    const res = await addCommentAction({ videoId, content: content.trim(), parentId });
    if (res.error) return alert(res.error);
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId
          ? { ...c, replies: [...c.replies, makeComment(res.id!, res.created_at!, content.trim())] }
          : c
      )
    );
  }

  async function remove(id: string, parentId?: string) {
    if (!confirm("Izohni o'chirasizmi?")) return;
    const res = await deleteCommentAction(id);
    if (res.error) return alert(res.error);
    if (parentId) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: c.replies.filter((r) => r.id !== id) }
            : c
        )
      );
    } else {
      setComments((prev) => prev.filter((c) => c.id !== id));
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Izohlar ({total})
      </h2>

      {currentUser ? (
        <div className="mb-6 flex gap-3">
          <Image
            src={currentUser.avatar_url || avatarFallback(currentUser.full_name)}
            alt={currentUser.full_name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
            unoptimized
          />
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              placeholder="Izoh yozing..."
              className="input resize-none"
            />
            <div className="mt-2 flex justify-end">
              <button onClick={addTop} disabled={busy || !text.trim()} className="btn-primary">
                Izoh qoldirish
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="mb-6 text-sm text-gray-500">
          Izoh qoldirish uchun tizimga kiring.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-gray-400">Hali izohlar yo&apos;q. Birinchi bo&apos;ling!</p>
      ) : (
        <ul className="space-y-5">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              uploaderId={uploaderId}
              currentUser={currentUser}
              onReply={addReply}
              onDelete={(id) => remove(id, undefined)}
              onDeleteReply={(id) => remove(id, c.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  uploaderId,
  currentUser,
  onReply,
  onDelete,
  onDeleteReply,
}: {
  comment: CommentView;
  uploaderId: string;
  currentUser: Props["currentUser"];
  onReply: (parentId: string, content: string) => void;
  onDelete: (id: string) => void;
  onDeleteReply: (id: string) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  return (
    <li className="flex gap-3">
      <Link href={`/profile/${comment.author.id}`}>
        <Image
          src={comment.author.avatar_url || avatarFallback(comment.author.full_name)}
          alt={comment.author.full_name}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
          unoptimized
        />
      </Link>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${comment.author.id}`} className="text-sm font-medium text-gray-900 hover:text-brand">
            {comment.author.full_name}
          </Link>
          {comment.author.id === uploaderId && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
              Muallif
            </span>
          )}
          <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-700">
          {comment.content}
        </p>

        <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
          <CommentLike commentId={comment.id} initialLikes={comment.likes} initialLiked={comment.liked} />
          {currentUser && (
            <button onClick={() => setReplying((o) => !o)} className="hover:text-brand">
              Javob berish
            </button>
          )}
          {currentUser?.id === comment.author.id && (
            <button onClick={() => onDelete(comment.id)} className="hover:text-red-500">
              O&apos;chirish
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-2 flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Javobingiz..."
              className="input flex-1 py-1.5"
            />
            <button
              onClick={() => {
                onReply(comment.id, replyText);
                setReplyText("");
                setReplying(false);
              }}
              className="btn-primary px-3 py-1.5 text-xs"
            >
              Yuborish
            </button>
          </div>
        )}

        {/* Javoblar */}
        {comment.replies.length > 0 && (
          <ul className="mt-3 space-y-3 border-l-2 border-gray-100 pl-3">
            {comment.replies.map((r) => (
              <li key={r.id} className="flex gap-2">
                <Link href={`/profile/${r.author.id}`}>
                  <Image
                    src={r.author.avatar_url || avatarFallback(r.author.full_name)}
                    alt={r.author.full_name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                    unoptimized
                  />
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${r.author.id}`} className="text-sm font-medium text-gray-900 hover:text-brand">
                      {r.author.full_name}
                    </Link>
                    {r.author.id === uploaderId && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                        Muallif
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{timeAgo(r.created_at)}</span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-700">
                    {r.content}
                  </p>
                  <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                    <CommentLike commentId={r.id} initialLikes={r.likes} initialLiked={r.liked} />
                    {currentUser?.id === r.author.id && (
                      <button onClick={() => onDeleteReply(r.id)} className="hover:text-red-500">
                        O&apos;chirish
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function CommentLike({
  commentId,
  initialLikes,
  initialLiked,
}: {
  commentId: string;
  initialLikes: number;
  initialLiked: boolean;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const prev = liked;
    setLiked(!prev);
    setLikes((c) => (prev ? Math.max(0, c - 1) : c + 1));
    const res = await toggleCommentLikeAction(commentId);
    setBusy(false);
    if (res.error) {
      setLiked(prev);
      setLikes((c) => (prev ? c + 1 : Math.max(0, c - 1)));
    }
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-1 hover:scale-105",
        liked ? "text-red-500" : "text-gray-400 hover:text-red-400"
      )}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {likes > 0 && <span>{likes}</span>}
    </button>
  );
}
