"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importCurriculumAction } from "@/server/content-import";

const curriculumData = {
  title: "Giáo trình Thực tập Điện tử số Cơ bản",
  author: "Nguyễn Duy Thắng, Nguyễn Thiện Thông — Trường CĐ Kỹ thuật Cao Thắng",
  lessons: [
    {
      title: "Bài 0: Hướng dẫn sử dụng bộ thực tập điện tử số cơ bản",
      sections: [
        { heading: "Mục đích – Yêu cầu", level: 1, bodyHtml: "<p>Giới thiệu một số khối chính trong KIT thực tập điện tử số cơ bản Digi Board 2 Type 3910.</p>" },
        { heading: "0.1. Khối nút nhấn", level: 2, bodyHtml: "<p>Chức năng tạo ra mức logic 0 và 1. Có 16 nút nhấn.</p>" },
        { heading: "0.2. Hiển thị Led đơn", level: 2, bodyHtml: "<p>12 led đơn màu đỏ, vàng, xanh lá. Ngõ vào mức 0 led tắt, mức 1 led sáng.</p>" },
        { heading: "0.3. Hiển thị led 7 đoạn", level: 2, bodyHtml: "<p>Gồm 2 led 7 đoạn. Kiểm tra chưa giải mã và đã giải mã.</p>" },
        { heading: "0.4. Khối tạo xung", level: 2, bodyHtml: "<p>Tạo tín hiệu xung vuông với tần số điều chỉnh qua bộ chia tần.</p>" },
      ],
    },
    {
      title: "Bài 1: Khảo sát cổng Logic",
      sections: [
        { heading: "Mục tiêu", level: 1, bodyHtml: "<p>Nhận dạng ký hiệu, hiểu chức năng và hoạt động của các cổng logic. Lắp ráp mạch đơn giản.</p>" },
        { heading: "1.1. Cổng NOT", level: 2, bodyHtml: "<p>Khảo sát bảng trạng thái cổng NOT với pull-up mức H.</p>" },
        { heading: "1.2. Cổng AND – NAND", level: 2, bodyHtml: "<p>Khảo sát datasheet IC 74LS20. Bảng trạng thái AND-NAND 4 ngõ vào.</p>" },
        { heading: "1.3. Cổng OR – NOR", level: 2, bodyHtml: "<p>Khảo sát datasheet IC 74LS14. Bảng trạng thái OR-NOR.</p>" },
        { heading: "1.4. Cổng EX-OR và EX-NOR", level: 2, bodyHtml: "<p>Khảo sát datasheet IC 74LS86. Bảng trạng thái EX-OR và EX-NOR.</p>" },
        { heading: "1.5. Cổng kết hợp AND và OR", level: 2, bodyHtml: "<p>Khảo sát datasheet IC 74LS51.</p>" },
        { heading: "1.6. Bài tập thực hành", level: 1, bodyHtml: "<p>4 bài tập thực hành với sơ đồ mạch, bảng trạng thái và biểu thức logic.</p>" },
      ],
    },
    {
      title: "Bài 2: Khảo sát mạch đa hợp và giải đa hợp",
      sections: [
        { heading: "Mục tiêu", level: 1, bodyHtml: "<p>Hiểu hoạt động MUX và DEMUX. Vận dụng thiết kế mạch điều khiển LED.</p>" },
        { heading: "2.1. Mạch đa hợp MUX", level: 2, bodyHtml: "<p>Khảo sát datasheet IC 74LS151. Khảo sát mạch MUX 4-&gt;1 trên KIT.</p>" },
        { heading: "2.2. Mạch giải đa hợp DEMUX", level: 2, bodyHtml: "<p>Khảo sát datasheet IC 74HC138, 74HC04. Khảo sát mạch DEMUX 1-&gt;4.</p>" },
        { heading: "2.3. Bài tập thực hành", level: 1, bodyHtml: "<p>3 bài tập: kết nối MUX/DEMUX, thiết kế mạch giải mã led 7 đoạn.</p>" },
      ],
    },
    {
      title: "Bài 3: Khảo sát Flip Flop",
      sections: [
        { heading: "Mục tiêu", level: 1, bodyHtml: "<p>Hiểu ký hiệu, chức năng, hoạt động của các FF cơ bản. Lập bảng trạng thái.</p>" },
        { heading: "3.1. Flip Flop JK", level: 2, bodyHtml: "<p>Khảo sát datasheet IC 74LS76. Kiểm tra hoạt động FF JK trên KIT.</p>" },
        { heading: "3.2. Khảo sát FF D", level: 2, bodyHtml: "<p>Kết nối và khảo sát FF D trên KIT.</p>" },
        { heading: "3.3. Khảo sát FF T", level: 2, bodyHtml: "<p>Kết nối J và K lại với nhau tạo FF T.</p>" },
        { heading: "3.4. Khảo sát FF SR", level: 2, bodyHtml: "<p>Kết nối và khảo sát FF SR trên KIT.</p>" },
        { heading: "3.5. Bài tập thực hành", level: 1, bodyHtml: "<p>Mạch đếm lên bất đồng bộ 2 bit dùng FF-JK. Mạch đếm xuống bất đồng bộ 2 bit.</p>" },
      ],
    },
    {
      title: "Bài 4: Khảo sát mạch đếm",
      sections: [
        { heading: "Mục tiêu", level: 1, bodyHtml: "<p>Kiến thức về IC đếm. Thiết kế mạch đếm cơ bản.</p>" },
        { heading: "4.1. Khảo sát bộ đếm 4 bit", level: 2, bodyHtml: "<p>Ký hiệu bộ đếm 4 bit. Các chân: CT=0 (reset), 2+/G1 (clock lên), 1-/G2 (clock xuống).</p>" },
        { heading: "4.2. Mạch đếm lên", level: 2, bodyHtml: "<p>Đếm lên từ 0 đến F. Đếm lên có đặt trước số đếm từ 1 lên 5.</p>" },
        { heading: "4.3. Mạch đếm xuống", level: 2, bodyHtml: "<p>Đếm xuống từ F về 0. Đếm xuống có đặt trước từ 8 về 4.</p>" },
        { heading: "4.4. Bài tập thực hành", level: 1, bodyHtml: "<p>10 bài tập thiết kế mạch đếm lên/xuống với hiển thị led 7 đoạn.</p>" },
      ],
    },
    {
      title: "Bài 5: Khảo sát thanh ghi dịch",
      sections: [
        { heading: "Mục tiêu", level: 1, bodyHtml: "<p>Nguyên lý hoạt động thanh ghi dịch 4-bit. Ứng dụng tạo hiệu ứng LED chạy.</p>" },
        { heading: "5.1. Khảo sát thanh ghi dịch 4 bit", level: 2, bodyHtml: "<p>Ký hiệu và bảng trạng thái thanh ghi dịch.</p>" },
        { heading: "5.2. Dịch nối tiếp sang phải", level: 2, bodyHtml: "<p>Dịch phải với serial input 1 và 0.</p>" },
        { heading: "5.3. Dịch nối tiếp sang trái", level: 2, bodyHtml: "<p>Dịch trái với serial input.</p>" },
        { heading: "5.4. Reset và nạp song song dữ liệu", level: 2, bodyHtml: "<p>Nạp song song 4-bit và chức năng Reset.</p>" },
        { heading: "5.5. LED sáng dần rồi tắt dần luân phiên", level: 2, bodyHtml: "<p>Hiệu ứng LED sáng dần rồi tắt dần dùng thanh ghi dịch.</p>" },
        { heading: "5.6. LED 1 sáng 2 tắt luân phiên", level: 2, bodyHtml: "<p>Hiệu ứng 1 sáng 2 tắt dùng cổng NOT và thanh ghi dịch.</p>" },
        { heading: "5.7. Bài tập thực hành", level: 1, bodyHtml: "<p>6 bài tập thiết kế hiệu ứng LED với thanh ghi dịch.</p>" },
      ],
    },
  ],
};

export function ImportCurriculumView() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ curriculumId: string; lessonIds: string[]; count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    try {
      const res = await importCurriculumAction(curriculumData);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import Curriculum</h1>
        <p className="text-sm text-muted-foreground">
          Import a structured curriculum into Knot with hierarchical lessons and tags.
        </p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-2">{curriculumData.title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{curriculumData.author}</p>

        <div className="space-y-2 mb-4">
          <h3 className="text-sm font-medium">Lessons ({curriculumData.lessons.length}):</h3>
          <ul className="space-y-1">
            {curriculumData.lessons.map((lesson, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                {lesson.title} — {lesson.sections.length} sections
              </li>
            ))}
          </ul>
        </div>

        {!result ? (
          <button
            onClick={handleImport}
            disabled={importing}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {importing ? "Importing..." : "Import Curriculum"}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">
              Successfully imported {result.count} lessons with the curriculum tag.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/notes/${result.curriculumId}`)}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                View Curriculum
              </button>
              {result.lessonIds.slice(0, 3).map((id) => (
                <button
                  key={id}
                  onClick={() => router.push(`/notes/${id}`)}
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  Lesson {result.lessonIds.indexOf(id) + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
