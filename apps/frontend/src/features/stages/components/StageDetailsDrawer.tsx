import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { useStageDetails, useStageMutations } from "../useOrderStages.js";
import { Button } from "../../../shared/ui/Button.js";
import { Card } from "../../../shared/ui/Card.js";
import { ImageGallery } from "../../../shared/ui/ImageGallery.js";
import { useAuthStore } from "../../../entities/user/store.js";

type StageDetailsDrawerProps = {
  stageId: string | null;
  onClose: () => void;
  allowUpdates?: boolean;
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Ожидает", icon: "⏳" },
  { value: "in_progress", label: "В работе", icon: "🔧" },
  { value: "done", label: "Готово", icon: "✅" },
  { value: "blocked", label: "Проблема", icon: "⚠️" },
];

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const StageDetailsDrawer = ({ stageId, onClose, allowUpdates = false }: StageDetailsDrawerProps) => {
  const { data: stage, isLoading } = useStageDetails(stageId);
  const { updateStatus, addComment, addAttachment, markViewed } = useStageMutations();
  const [comment, setComment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (stageId && user?.role === "mechanic") {
      markViewed.mutate(stageId);
    }
  }, [stageId, user?.role]);

  useEffect(() => {
    setComment("");
  }, [stageId]);

  const attachments = useMemo(
    () =>
      stage?.attachments?.map((attachment) => ({
        id: attachment.id,
        url: attachment.filePath,
        title: attachment.fileName,
        description: attachment.description ?? undefined,
      })) ?? [],
    [stage?.attachments],
  );

  if (!stageId) {
    return null;
  }

  const handleStatusChange = (status: string) => {
    if (!stageId) return;
    updateStatus.mutate({ stageId, status });
  };

  const handleAddComment = () => {
    if (!stageId || !comment.trim()) return;
    addComment.mutate({ stageId, content: comment.trim() }, { onSuccess: () => setComment("") });
  };

  const handleUpload = async (file: File) => {
    if (!stageId) return;
    setIsUploading(true);
    try {
      const base64 = await fileToBase64(file);
      await addAttachment.mutateAsync({
        stageId,
        base64,
        fileName: file.name,
        mimeType: file.type,
      });
    } catch (error) {
      console.error("Attachment upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl h-full bg-dark-900 border-l border-dark-700 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
          <div>
            <p className="text-xs text-dark-400 uppercase tracking-wide">Этап</p>
            <h3 className="text-2xl font-bold text-dark-50">{stage?.name ?? "Загрузка..."}</h3>
            {stage?.order && <p className="text-sm text-dark-400 mt-1">Заказ: {stage.order.title}</p>}
          </div>
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-dark-800 hover:bg-dark-700 flex items-center justify-center text-xl text-dark-200"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto space-y-6 p-6">
          {isLoading && <div className="text-dark-400">Загрузка...</div>}

          {stage && (
            <>
              <Card variant="glass">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase text-dark-500 tracking-wide mb-2">Статус</p>
                    <div className="grid grid-cols-2 gap-2">
                      {STATUS_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          variant={stage.status === option.value ? "gradient" : "ghost"}
                          onClick={() => allowUpdates && handleStatusChange(option.value)}
                          disabled={!allowUpdates}
                        >
                          <span className="mr-2">{option.icon}</span>
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-dark-300 space-y-1">
                    <p>Назначен: {stage.mechanic?.fullName ?? "не назначен"}</p>
                    <p>Начат: {stage.startedAt ? new Date(stage.startedAt).toLocaleString() : "—"}</p>
                    <p>Завершен: {stage.completedAt ? new Date(stage.completedAt).toLocaleString() : "—"}</p>
                  </div>
                </div>
              </Card>

              <Card variant="glass">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-dark-50">Комментарии</h4>
                    <span className="text-sm text-dark-400">{stage.comments?.length ?? 0}</span>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-auto pr-2">
                    {stage.comments?.length ? (
                      stage.comments.map((item) => (
                        <div key={item.id} className="p-3 rounded-lg bg-dark-800 border border-dark-700">
                          <div className="flex items-center justify-between text-xs text-dark-400 mb-1">
                            <span>{item.author.fullName}</span>
                            <span>{new Date(item.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-dark-100">{item.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-dark-500">Комментариев пока нет</p>
                    )}
                  </div>
                  {allowUpdates && (
                    <div className="space-y-2">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl bg-dark-800 border border-dark-700 text-dark-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Оставьте комментарий..."
                      />
                      <Button className="w-full" onClick={handleAddComment} disabled={!comment.trim()}>
                        Добавить комментарий
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              <Card variant="glass">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-dark-50">Фото и файлы</h4>
                    {allowUpdates && (
                      <label className="text-sm text-primary-400 cursor-pointer hover:underline">
                        {isUploading ? "Загрузка..." : "Добавить"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void handleUpload(file);
                              event.target.value = "";
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <ImageGallery images={attachments} />
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

