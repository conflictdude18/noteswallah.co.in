"use client";

export default function PDFViewer({ file }: { file: string }) {
  return (
    <div className="h-[62vh] overflow-hidden bg-[#111] md:h-[82vh]">
      <iframe
        src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
          file
        )}`}
        title="PDF Preview"
        className="h-full w-full border-0 bg-[#111]"
      />
    </div>
  );
}