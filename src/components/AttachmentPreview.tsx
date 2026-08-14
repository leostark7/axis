"use client";

import { useState } from "react";
import { Attachment } from "@/lib/demandTypes";
import { X, FileText, Image as ImageIcon, Eye } from "lucide-react";

function isImage(name: string) {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(name);
}

function isPdf(name: string) {
  return /\.pdf$/i.test(name);
}

export default function AttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove: () => void;
}) {
  const [lightbox, setLightbox] = useState(false);
  const image = isImage(attachment.name);
  const pdf = isPdf(attachment.name);

  return (
    <>
      <div className="flex items-center gap-2 rounded-lg border border-[#101a2e]/10 bg-white/50 px-3 py-2 text-xs">
        {image ? (
          <button
            onClick={() => setLightbox(true)}
            className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-[#101a2e]/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={attachment.url} alt={attachment.name} className="h-full w-full object-cover" />
          </button>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <FileText size={16} />
          </div>
        )}
        <a
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 truncate font-medium text-[#101a2e] hover:underline"
        >
          {attachment.name}
        </a>
        <span className="shrink-0 text-[#101a2e]/60">{(attachment.size / 1024).toFixed(0)} KB</span>
        {(image || pdf) && (
          <button
            onClick={() => setLightbox(true)}
            title="Pré-visualizar"
            className="shrink-0 text-[#101a2e]/60 hover:text-blue-600"
          >
            <Eye size={14} />
          </button>
        )}
        <button onClick={onRemove} className="shrink-0 text-[#101a2e]/60 hover:text-red-500">
          <X size={13} />
        </button>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6"
          onClick={() => setLightbox(false)}
        >
          <div className="relative flex max-h-full max-w-4xl flex-col" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(false)}
              className="absolute -top-10 right-0 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X size={18} />
            </button>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attachment.url}
                alt={attachment.name}
                className="max-h-[80vh] max-w-full rounded-xl object-contain"
              />
            ) : (
              <iframe
                src={attachment.url}
                title={attachment.name}
                className="h-[80vh] w-[80vw] rounded-xl bg-white"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
